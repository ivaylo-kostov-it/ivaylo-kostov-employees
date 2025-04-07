import { Inject, Service } from 'typedi';
import { DataSource, Repository } from 'typeorm';
import { Project } from '../entities/Project';

@Service()
export class ProjectService {
    private projectRepository: Repository<Project>;

    constructor(@Inject() dataSource: DataSource) {
        this.projectRepository = dataSource.getRepository(Project);
    }

    async findAll(): Promise<Project[]> {
        return this.projectRepository.find();
    }

    async findOne(id: number): Promise<Project | string> {
        const project = await this.projectRepository.findOne({ where: { id } });
        if (!project) return 'Project not found';
        return project;
    }

    async create(project: Project): Promise<Project> {
        return this.projectRepository.save(project);
    }

    async update(id: number, project: Project): Promise<Project | string> {
        const result = await this.projectRepository.update(id, project);
        if (!result.affected || result.affected < 1) return 'Project not found';
        return await this.findOne(id);
    }

    async delete(id: number): Promise<void | string> {
        const result = await this.projectRepository.delete(id);
        if (!result.affected || result.affected < 1) return 'Project not found';
    }
}
