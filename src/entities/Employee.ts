import { Entity, Column, OneToMany, PrimaryColumn } from 'typeorm';
import { Assignment } from './Assignment';

@Entity()
export class Employee {
  @PrimaryColumn()
  id: number;

  @Column()
  name: string;

  @OneToMany(() => Assignment, assignment => assignment.employee, {
    onDelete: 'CASCADE'
  })
  assignments: Assignment[];
}
