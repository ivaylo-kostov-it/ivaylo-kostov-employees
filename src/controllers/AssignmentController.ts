import { JsonController, Get, Post, UseBefore, UploadedFile, NotFoundError, BadRequestError } from 'routing-controllers';
import { Service } from 'typedi';
import { AssignmentService } from '../services/AssignmentService';
import { AuthMiddleware } from '../middlewares/AuthMiddleware';
import { CsvParser } from '../utils/CsvParser';
import * as File2 from 'multer';
import { Assignment } from '../entities/Assignment';
import { CollaborationDto } from '../dtos/CollaborationDto';

@JsonController('/assignments')
@Service()
export class AssignmentController {
    constructor(
        private assignmentService: AssignmentService,
        private csvParser: CsvParser
    ) { }

    @Get('/longest-collaboration')
    @UseBefore(AuthMiddleware)
    async getLongestCollaboration(): Promise<CollaborationDto> {
        const result = await this.assignmentService.findLongestCollaboration();
        if (typeof result === 'string') throw new NotFoundError(result);
        return result;
    }

    @Get()
    @UseBefore(AuthMiddleware)
    async getAll(): Promise<Assignment[]> {
        return this.assignmentService.findAll();
    }

    @Post('/upload')
    async uploadCsv(@UploadedFile('file') file: File2.Multer): Promise<{ success: boolean, message: string }> {
        const assignments = await this.csvParser.parse(file);
        const result = await this.assignmentService.saveAll(assignments);
        if (typeof result === 'string') throw new BadRequestError(result);
        return { success: true, message: 'File uploaded and data processed successfully' };
    }
}
