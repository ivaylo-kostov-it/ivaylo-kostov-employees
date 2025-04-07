import { Service } from 'typedi';
import * as fs from 'fs';
import * as csv from 'fast-csv';
import { AssignmentDto } from '../dtos/AssignmentDto';

@Service()
export class CsvParser {
    async parse(file: any): Promise<AssignmentDto[]> {
        return new Promise((resolve, reject) => {
            const assignments: AssignmentDto[] = [];

            if (file.buffer) {
                // Handle file as a buffer
                csv.parseString(file.buffer.toString(), { headers: true, trim: true })
                    .on('data', (row) => {
                        assignments.push(this.buildAssignment(row));
                    })
                    .on('end', () => {
                        resolve(assignments);
                    })
                    .on('error', reject);
            } else if (file.path) {
                // Handle file as a path
                fs.createReadStream(file.path)
                    .pipe(csv.parse({ headers: true, trim: true }))
                    .on('data', (row) => {
                        assignments.push(this.buildAssignment(row));
                    })
                    .on('end', () => {
                        // Remove the temporary file
                        fs.unlink(file.path, (err) => {
                            if (err) console.error('Error deleting temporary file:', err);
                        });
                        resolve(assignments);
                    })
                    .on('error', reject);
            }
        });
    }

    private buildAssignment(row: any) {
        return {
            employeeId: row.EmpID.trim(),
            projectId: row.ProjectID.trim(),
            dateFrom: row.DateFrom.trim(),
            dateTo: row.DateTo.trim(),
        };
    }
}
