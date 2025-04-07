import { Inject, Service } from 'typedi';
import { DataSource, Repository } from 'typeorm';
import { Employee } from '../entities/Employee';

@Service()
export class EmployeeService {
    private employeeRepository: Repository<Employee>;

    constructor(@Inject() dataSource: DataSource) {
        this.employeeRepository = dataSource.getRepository(Employee);
    }

    async findAll(): Promise<Employee[]> {
        return this.employeeRepository.find();
    }

    async findOne(id: number): Promise<Employee | string> {
        const employee = await this.employeeRepository.findOne({ where: { id } });
        if (!employee) return 'Employee not found';
        return employee;
    }

    async create(employee: Employee): Promise<Employee> {
        return this.employeeRepository.save(employee);
    }

    async update(id: number, employee: Employee): Promise<Employee | string> {
        const result = await this.employeeRepository.update(id, employee);
        if (!result.affected || result.affected < 1) return 'Employee not found';
        return await this.findOne(id);
    }

    async delete(id: number): Promise<void | string> {
        const result = await this.employeeRepository.delete(id);
        if (!result.affected || result.affected < 1) return 'Employee not found';
    }
}
