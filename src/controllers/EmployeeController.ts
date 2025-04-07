import { JsonController, Get, Post, Put, Delete, Param, Body, UseBefore, NotFoundError } from 'routing-controllers';
import { Service } from 'typedi';
import { Employee } from '../entities/Employee';
import { EmployeeService } from '../services/EmployeeService';
import { AuthMiddleware } from '../middlewares/AuthMiddleware';

@JsonController('/employees')
@Service()
export class EmployeeController {
    constructor(private employeeService: EmployeeService) { }

    @Get()
    @UseBefore(AuthMiddleware)
    async getAll(): Promise<Employee[]> {
        return this.employeeService.findAll();
    }

    @Get('/:id')
    @UseBefore(AuthMiddleware)
    async getOne(@Param('id') id: number): Promise<Employee> {
        const result = await this.employeeService.findOne(id);
        if (typeof result === 'string') throw new NotFoundError(result);
        return result;
    }

    @Post()
    async create(@Body({ validate: true }) employee: Employee): Promise<Employee> {
        return this.employeeService.create(employee);
    }

    @Put('/:id')
    async update(@Param('id') id: number, @Body() employee: Employee): Promise<Employee> {
        const result = await this.employeeService.update(id, employee);
        if (typeof result === 'string') throw new NotFoundError(result);
        return result;
    }

    @Delete('/:id')
    async delete(@Param('id') id: number): Promise<{ success: boolean }> {
        const result = await this.employeeService.delete(id);
        if (typeof result === 'string') throw new NotFoundError(result);
        return { success: true };
    }
}
