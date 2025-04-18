import { Inject, Service } from 'typedi';
import { DataSource, IsNull, LessThanOrEqual, MoreThanOrEqual, Repository } from 'typeorm';
import { Assignment } from '../entities/Assignment';
import { AssignmentDto } from '../dtos/AssignmentDto';
import { CollaborationDto } from '../dtos/CollaborationDto';

@Service()
export class AssignmentService {
    private assignmentRepository: Repository<Assignment>

    constructor(@Inject() dataSource: DataSource) {
        this.assignmentRepository = dataSource.getRepository(Assignment);
    }

    async findLongestCollaboration(): Promise<CollaborationDto | string> {
        // Fetch all assignments
        const assignments = await this.assignmentRepository.find({
            select: ["employeeId", "projectId", "dateFrom", "dateTo"]
        });

        // Function for calculating the number of days between two dates
        const daysBetween = (start: Date, end: Date): number => {
            const diffTime = Math.abs(end.getTime() - start.getTime());
            return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        };

        // Create collaboration record
        const collaborations: Record<string, number> = {};

        // Group assignments by projects
        const projectAssignmentsMap = assignments.reduce((acc, assignment) => {
            if (!acc[assignment.projectId]) {
                acc[assignment.projectId] = [];
            }
            acc[assignment.projectId].push({
                employeeId: assignment.employeeId,
                dateFrom: new Date(assignment.dateFrom),
                dateTo: assignment.dateTo ? new Date(assignment.dateTo) : new Date()
            });
            return acc;
        }, {} as Record<number, Array<{ employeeId: number, dateFrom: Date, dateTo: Date }>>);

        // Process all projects
        Object.values(projectAssignmentsMap).forEach(projectEmployees => {
            // Calculate overlapping periods for each employee pair
            for (let i = 0; i < projectEmployees.length; i++) {
                for (let j = i + 1; j < projectEmployees.length; j++) {
                    const emp1 = projectEmployees[i];
                    const emp2 = projectEmployees[j];

                    // Check if there's an overlap
                    const overlapStart = new Date(Math.max(emp1.dateFrom.getTime(), emp2.dateFrom.getTime()));
                    const overlapEnd = new Date(Math.min(emp1.dateTo.getTime(), emp2.dateTo.getTime()));

                    if (overlapStart <= overlapEnd) {
                        const days = daysBetween(overlapStart, overlapEnd);

                        // Ensure the first ID is always smaller than the second
                        const smallerId = Math.min(emp1.employeeId, emp2.employeeId);
                        const largerId = Math.max(emp1.employeeId, emp2.employeeId);
                        const pairKey = `${smallerId}-${largerId}`;

                        // Add the days to the total for this pair
                        collaborations[pairKey] = (collaborations[pairKey] || 0) + days;
                    }
                }
            }
        });

        // If no overlapping periods are found
        if (Object.keys(collaborations).length === 0) {
            return 'No overlapping work periods found';
        }

        // Find the pair with the most days worked together
        const entries = Object.entries(collaborations);
        const [longestPair, maxDays] = entries.reduce(
            (max, current) => current[1] > max[1] ? current : max,
            entries[0]
        );

        // Split the key to get the employee IDs
        const [employeeId1, employeeId2] = longestPair.split('-').map(Number);

        return {
            employeeId1,
            employeeId2,
            daysWorkedTogether: maxDays,
        };
    }

    async findAll(): Promise<Assignment[]> {
        return this.assignmentRepository.find();
    }

    async saveAll(assignmentDtos: AssignmentDto[]): Promise<void | string> {
        const assignments: Assignment[] = [];
        for (const assignmentDto of assignmentDtos) {
            const assignment = this.assignmentRepository.create();
            assignment.employeeId = parseInt(assignmentDto.employeeId);
            assignment.projectId = parseInt(assignmentDto.projectId);
            assignment.dateFrom = new Date(assignmentDto.dateFrom);
            assignment.dateTo = assignmentDto.dateTo === 'undefined' ? null : new Date(assignmentDto.dateTo);

            const result = await this.validateNoOverlap(assignment);
            if (typeof result === 'string') return result;
            assignments.push(assignment);
        }

        await this.assignmentRepository.save(assignments);
    }

    /**
     * Looking for cases where either:
     * - The new assignment starts during an existing assignment
     * - The new assignment ends during an existing assignment
     * - The new assignment completely contains an existing assignment
     * - The new assignment is completely contained within an existing assignment
     * @param assignment
     * @returns string | undefined
     */
    private async validateNoOverlap(assignment: Assignment) {
        // Define our where conditions based on dateTo being null or not
        const whereConditions = {
            employeeId: assignment.employeeId,
            projectId: assignment.projectId,
        };

        let overlappingAssignments: Assignment[] = [];

        // If the new assignment has an end date
        if (assignment.dateTo) {
            // Check for any assignments that overlap with this date range
            overlappingAssignments = await this.assignmentRepository.find({
                where: [
                    // Scenario: New assignment with end date overlaps with existing assignment that has an end date
                    // Example: New(May 1 - Jun 30), Existing(Apr 15 - May 15) - Partial overlap at beginning
                    // Example: New(May 1 - Jun 30), Existing(Jun 15 - Jul 15) - Partial overlap at end
                    // Example: New(May 1 - Jun 30), Existing(Apr 15 - Jul 15) - Existing assignment contains new
                    // Example: New(May 1 - Jun 30), Existing(May 15 - Jun 15) - New assignment contains existing
                    {
                        ...whereConditions,
                        dateFrom: LessThanOrEqual(assignment.dateTo),  // Existing assignment starts before or on the day new assignment ends
                        dateTo: MoreThanOrEqual(assignment.dateFrom),  // Existing assignment ends after or on the day new assignment starts
                    },

                    // Scenario: New assignment with end date overlaps with ongoing assignment (no end date)
                    // Example: New(May 1 - Jun 30), Existing(Apr 15 - null) - Ongoing assignment overlaps with new
                    {
                        ...whereConditions,
                        dateFrom: LessThanOrEqual(assignment.dateTo),  // Existing assignment starts before or on the day new assignment ends
                        dateTo: IsNull(),  // Existing assignment has no end date (ongoing)
                    }
                ]
            });
        } else {
            // The new assignment is ongoing (no end date)
            // Check if there are any assignments that would conflict with this indefinite assignment
            overlappingAssignments = await this.assignmentRepository.find({
                where: [
                    // Scenario: Ongoing new assignment overlaps with future existing assignments
                    // Example: New(May 1 - null), Existing(May 15 - Jun 30) - New ongoing assignment includes future assignment
                    {
                        ...whereConditions,
                        dateFrom: MoreThanOrEqual(assignment.dateFrom), // Existing assignment starts on or after new assignment starts
                    },

                    // Scenario: Ongoing new assignment overlaps with existing assignment that ends in the future
                    // Example: New(May 1 - null), Existing(Apr 15 - May 15) - New ongoing assignment overlaps with an assignment ending later
                    {
                        ...whereConditions,
                        dateTo: MoreThanOrEqual(assignment.dateFrom), // Existing assignment ends on or after new assignment starts
                    },

                    // Scenario: Both new and existing assignments are ongoing
                    // Example: New(May 1 - null), Existing(Apr 15 - null) - Two ongoing assignments would overlap indefinitely
                    {
                        ...whereConditions,
                        dateTo: IsNull(), // Existing assignment has no end date (ongoing)
                    }
                ]
            });
        }

        if (overlappingAssignments.length > 0) {
            return this.throwOverlapError(assignment, overlappingAssignments[0]);
        }
    }

    private throwOverlapError(newAssignment: Assignment, existingAssignment: Assignment): string {
        const existingDateToStr = existingAssignment.dateTo ?
            existingAssignment.dateTo.toISOString().split('T')[0] :
            'ongoing';

        const newDateToStr = newAssignment.dateTo ?
            newAssignment.dateTo.toISOString().split('T')[0] :
            'ongoing';

        return (
            `Employee ${newAssignment.employeeId} is already assigned to project ${newAssignment.projectId} ` +
            `from ${existingAssignment.dateFrom.toISOString().split('T')[0]} ` +
            `to ${existingDateToStr}. ` +
            `The new assignment period (${newAssignment.dateFrom.toISOString().split('T')[0]} to ${newDateToStr}) overlaps.`
        );
    }
}
