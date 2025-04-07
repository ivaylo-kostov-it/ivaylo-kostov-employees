import { Entity, Column, OneToMany, PrimaryColumn } from 'typeorm';
import { Assignment } from './Assignment';

@Entity()
export class Project {
    @PrimaryColumn()
    id: number;

    @Column()
    name: string;

    @OneToMany(() => Assignment, assignment => assignment.project, {
        onDelete: 'CASCADE'
    })
    assignments: Assignment[];
}
