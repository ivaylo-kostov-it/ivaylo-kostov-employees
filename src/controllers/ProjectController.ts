import { JsonController, Get, Post, Put, Delete, Param, Body, UseBefore, BadRequestError, NotFoundError } from 'routing-controllers';
import { Service } from 'typedi';
import { Project } from '../entities/Project';
import { ProjectService } from '../services/ProjectService';
import { AuthMiddleware } from '../middlewares/AuthMiddleware';

@JsonController('/projects')
@Service()
export class ProjectController {
    constructor(private projectService: ProjectService) { }

    @Get()
    @UseBefore(AuthMiddleware)
    async getAll(): Promise<Project[]> {
        return this.projectService.findAll();
    }

    @Get('/:id')
    @UseBefore(AuthMiddleware)
    async getOne(@Param('id') id: number): Promise<Project> {
        const result = await this.projectService.findOne(id);
        if (typeof result === 'string') throw new NotFoundError(result);
        return result;
    }

    @Post()
    async create(@Body({ validate: true }) project: Project): Promise<Project> {
        return this.projectService.create(project);
    }

    @Put('/:id')
    async update(@Param('id') id: number, @Body() project: Project): Promise<Project> {
        const result = await this.projectService.update(id, project);
        if (typeof result === 'string') throw new NotFoundError(result);
        return result;
    }

    @Delete('/:id')
    async delete(@Param('id') id: number): Promise<{ success: boolean }> {
        const result = await this.projectService.delete(id);
        if (typeof result === 'string') throw new NotFoundError(result);
        return { success: true };
    }
}
