import { Exclude } from 'class-transformer';
import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, AfterLoad } from 'typeorm';
import { Employee } from './Employee';
import { Project } from './Project';

@Entity()
export class Assignment {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    employeeId: number;

    @Column()
    projectId: number;

    @Column({ type: 'date' })
    dateFrom: Date;

    @Column({ type: 'date', nullable: true })
    dateTo: Date | null;

    @ManyToOne(() => Employee, employee => employee.assignments)
    @JoinColumn({ name: 'employeeId' })
    employee: Employee;

    @ManyToOne(() => Project, project => project.assignments)
    @JoinColumn({ name: 'projectId' })
    project: Project;

    constructor(employeeId: number, projectId: number, dateFrom: Date, dateTo: Date | null) {
        this.employeeId = employeeId;
        this.projectId = projectId;
        this.dateFrom = dateFrom;
        this.dateTo = dateTo;
    }

    @AfterLoad()
    convertToDate() {
        this.dateFrom = new Date(this.dateFrom);
        this.dateTo = this.dateTo ? new Date(this.dateTo) : null;
    }
}
