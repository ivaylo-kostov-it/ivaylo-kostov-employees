import { Container } from 'typedi';
import { Repository, DataSource } from 'typeorm';
import { jest } from '@jest/globals';
import { Assignment } from '../../../src/entities/Assignment';
import { AssignmentService } from '../../../src/services/AssignmentService';

describe('AssignmentService', () => {
    let assignmentService: AssignmentService;
    let assignmentRepository: Repository<Assignment>;
    let dataSource: DataSource;

    beforeAll(() => {
        // Mock the DataSource and its getRepository method
        dataSource = {
            getRepository: jest.fn().mockReturnValue({
                find: jest.fn(),
                create: jest.fn(),
                save: jest.fn(),
            })
        } as unknown as DataSource;

        // Manually register the service in Typedi container
        Container.set(DataSource, dataSource); // Register the mock dataSource into the container
        assignmentService = Container.get(AssignmentService); // Get the instance of AssignmentService from Typedi

        // Assign the repository to the mock assignmentRepository variable directly
        assignmentRepository = dataSource.getRepository(Assignment);
    });

    describe('Find longest collaboration', () => {
        afterAll(() => {
            jest.clearAllMocks();
        });

        // Test 1: No overlapping collaboration
        it('should throw an error when no overlapping collaboration exists', async () => {
            // Mocking data
            (assignmentRepository.find as jest.MockedFunction<typeof assignmentRepository.find>).mockResolvedValue([
                new Assignment(1, 1, new Date('2025-01-01'), new Date('2025-02-01')),
                new Assignment(2, 1, new Date('2025-03-01'), new Date('2025-04-01')),
            ]);

            await expect(assignmentService.findLongestCollaboration()).resolves.toBe(
                'No overlapping work periods found'
            );
        });

        // Test 2: Multiple overlapping collaborations, find the one with most days worked together
        it('should return the pair with the most days worked together', async () => {
            // Mocking data
            (assignmentRepository.find as jest.MockedFunction<typeof assignmentRepository.find>).mockResolvedValue([
                new Assignment(1, 1, new Date('2025-01-01'), new Date('2025-02-01')),
                new Assignment(2, 1, new Date('2025-01-15'), new Date('2025-02-15')),
                new Assignment(3, 1, new Date('2025-02-01'), new Date('2025-03-01'))
            ]);

            const result = await assignmentService.findLongestCollaboration();

            expect(result).toEqual({
                employeeId1: 1,
                employeeId2: 2,
                daysWorkedTogether: 17 // January 15th to February 1st = 17 days
            });
        });

        // Test 3: Single collaboration between two employees
        it('should return the only collaboration when there is only one pair', async () => {
            // Mocking data
            (assignmentRepository.find as jest.MockedFunction<typeof assignmentRepository.find>).mockResolvedValue([
                new Assignment(1, 1, new Date('2025-01-01'), new Date('2025-02-01')),
                new Assignment(2, 1, new Date('2025-01-15'), new Date('2025-02-15'))
            ]);

            const result = await assignmentService.findLongestCollaboration();

            expect(result).toEqual({
                employeeId1: 1,
                employeeId2: 2,
                daysWorkedTogether: 17 // January 15th to February 1st = 17 days
            });
        });

        // Test 4: Overlapping with null `dateTo` (i.e., ongoing project)
        it('should calculate overlap correctly when dateTo is null', async () => {
            // Mocking data
            (assignmentRepository.find as jest.MockedFunction<typeof assignmentRepository.find>).mockResolvedValue([
                new Assignment(1, 1, new Date('2025-01-01'), new Date('2025-02-01')),
                new Assignment(2, 1, new Date('2025-01-15'), null)
            ]);

            const result = await assignmentService.findLongestCollaboration();

            expect(result).toEqual({
                employeeId1: 1,
                employeeId2: 2,
                daysWorkedTogether: 17 // January 15th to February 1st = 17 days
            });
        });

        // Test 5: Multiple projects with overlaps
        it('should handle multiple projects correctly and return the pair with the most overlap across projects', async () => {
            // Mocking data
            (assignmentRepository.find as jest.MockedFunction<typeof assignmentRepository.find>).mockResolvedValue([
                new Assignment(1, 1, new Date('2025-01-01'), new Date('2025-02-01')),
                new Assignment(2, 1, new Date('2025-01-15'), new Date('2025-02-15')),
                new Assignment(1, 2, new Date('2025-02-01'), new Date('2025-02-28')),
                new Assignment(2, 2, new Date('2025-02-15'), new Date('2025-03-01')),
            ]);

            const result = await assignmentService.findLongestCollaboration();

            expect(result).toEqual({
                employeeId1: 1,
                employeeId2: 2,
                daysWorkedTogether: 30 // Overlap in project 1: Jan 15th to Feb 1st = 17 days and overlap in project 2: Feb 15th to Feb 28th = 13 days
            });
        });
    });

    describe('Save assignments', () => {
        const assignmentOverlapErrorRegex = new RegExp(/Employee \d+ is already assigned to project \d+ from \d{4}-\d{2}-\d{2} to (\d{4}-\d{2}-\d{2}|ongoing). The new assignment period \(\d{4}-\d{2}-\d{2} to (\d{4}-\d{2}-\d{2}|ongoing)\) overlaps./);

        beforeEach(() => {
            jest.clearAllMocks();
        });

        // Test 1: Successful case - no overlap with existing assignments
        it('should save assignments when there are no overlaps', async () => {
            const assignmentDto = {
                employeeId: '1',
                projectId: '1',
                dateFrom: '2025-01-01',
                dateTo: '2025-02-01'
            };
            const assignmentDtos = [assignmentDto];

            // Mock create to return Assignment instances for each dto
            (assignmentRepository.create as jest.MockedFunction<any>).mockImplementation(() => {
                return new Assignment(parseInt(assignmentDto.employeeId), parseInt(assignmentDto.projectId), new Date(assignmentDto.dateFrom), new Date(assignmentDto.dateTo));
            });

            // Mock find to return no overlapping assignments
            (assignmentRepository.find as jest.MockedFunction<typeof assignmentRepository.find>).mockResolvedValue([]);

            await expect(assignmentService.saveAll(assignmentDtos)).resolves.not.toThrow();
            expect(assignmentRepository.save).toHaveBeenCalled();
        });

        // Test 2: New assignment starts during an existing assignment
        it('should throw error when new assignment starts during an existing assignment', async () => {
            const existingAssignment = new Assignment(1, 1, new Date('2025-01-01'), new Date('2025-02-15'));
            const assignmentDto = {
                employeeId: '1',
                projectId: '1',
                dateFrom: '2025-02-01', // Overlaps with existing assignment
                dateTo: '2025-03-01'
            };
            const assignmentDtos = [assignmentDto];

            // Setup create mock for this specific test
            (assignmentRepository.create as jest.MockedFunction<any>).mockImplementation(() => {
                return new Assignment(parseInt(assignmentDto.employeeId), parseInt(assignmentDto.projectId), new Date(assignmentDto.dateFrom), new Date(assignmentDto.dateTo));
            });

            (assignmentRepository.find as jest.MockedFunction<typeof assignmentRepository.find>).mockResolvedValueOnce([existingAssignment]);

            await expect(assignmentService.saveAll(assignmentDtos)).resolves.toMatch(assignmentOverlapErrorRegex);
            expect(assignmentRepository.save).not.toHaveBeenCalled();
        });

        // Test 3: New assignment ends during an existing assignment
        it('should throw error when new assignment ends during an existing assignment', async () => {
            const existingAssignment = new Assignment(1, 1, new Date('2025-02-15'), new Date('2025-03-15'));
            const assignmentDto = {
                employeeId: '1',
                projectId: '1',
                dateFrom: '2025-02-01', // Starts before but ends during existing
                dateTo: '2025-03-01'
            };
            const assignmentDtos = [assignmentDto];

            // Setup create mock for this specific test
            (assignmentRepository.create as jest.MockedFunction<any>).mockImplementation(() => {
                return new Assignment(parseInt(assignmentDto.employeeId), parseInt(assignmentDto.projectId), new Date(assignmentDto.dateFrom), new Date(assignmentDto.dateTo));
            });

            (assignmentRepository.find as jest.MockedFunction<typeof assignmentRepository.find>).mockResolvedValueOnce([existingAssignment]);

            await expect(assignmentService.saveAll(assignmentDtos)).resolves.toMatch(assignmentOverlapErrorRegex);
            expect(assignmentRepository.save).not.toHaveBeenCalled();
        });

        // Test 4: New assignment completely contains an existing assignment
        it('should throw error when new assignment completely contains an existing assignment', async () => {
            const existingAssignment = new Assignment(1, 1, new Date('2025-02-01'), new Date('2025-02-15'));
            const assignmentDto = {
                employeeId: '1',
                projectId: '1',
                dateFrom: '2025-01-01', // Completely contains existing
                dateTo: '2025-03-01',
            };
            const assignmentDtos = [assignmentDto];

            // Setup create mock for this specific test
            (assignmentRepository.create as jest.MockedFunction<any>).mockImplementation(() => {
                return new Assignment(parseInt(assignmentDto.employeeId), parseInt(assignmentDto.projectId), new Date(assignmentDto.dateFrom), new Date(assignmentDto.dateTo));
            });

            (assignmentRepository.find as jest.MockedFunction<typeof assignmentRepository.find>).mockResolvedValueOnce([existingAssignment]);

            await expect(assignmentService.saveAll(assignmentDtos)).resolves.toMatch(assignmentOverlapErrorRegex);
            expect(assignmentRepository.save).not.toHaveBeenCalled();
        });

        // Test 5: New assignment is completely contained within an existing assignment
        it('should throw error when new assignment is completely contained within an existing assignment', async () => {
            const existingAssignment = new Assignment(1, 1, new Date('2025-01-01'), new Date('2025-03-01'));
            const assignmentDto = {
                employeeId: '1',
                projectId: '1',
                dateFrom: '2025-01-15', // Completely contained within existing
                dateTo: '2025-02-15'
            };
            const assignmentDtos = [assignmentDto];

            // Setup create mock for this specific test
            (assignmentRepository.create as jest.MockedFunction<any>).mockImplementation(() => {
                return new Assignment(parseInt(assignmentDto.employeeId), parseInt(assignmentDto.projectId), new Date(assignmentDto.dateFrom), new Date(assignmentDto.dateTo));
            });

            (assignmentRepository.find as jest.MockedFunction<typeof assignmentRepository.find>).mockResolvedValueOnce([existingAssignment]);

            await expect(assignmentService.saveAll(assignmentDtos)).resolves.toMatch(assignmentOverlapErrorRegex);
            expect(assignmentRepository.save).not.toHaveBeenCalled();
        });

        // Test 6: New assignment with null dateTo (ongoing) conflicts with existing assignment
        it('should throw error when new ongoing assignment conflicts with existing assignment', async () => {
            const existingAssignment = new Assignment(1, 1, new Date('2025-02-01'), new Date('2025-03-01'));
            const assignmentDto = {
                employeeId: '1',
                projectId: '1',
                dateFrom: '2025-01-01', // Ongoing assignment would overlap
                dateTo: 'undefined' // This should be treated as null
            };
            const assignmentDtos = [assignmentDto];

            // Setup create mock for this specific test
            (assignmentRepository.create as jest.MockedFunction<any>).mockImplementation(() => {
                return new Assignment(parseInt(assignmentDto.employeeId), parseInt(assignmentDto.projectId), new Date(assignmentDto.dateFrom), new Date(assignmentDto.dateTo));
            });

            (assignmentRepository.find as jest.MockedFunction<typeof assignmentRepository.find>).mockResolvedValueOnce([existingAssignment]);

            await expect(assignmentService.saveAll(assignmentDtos)).resolves.toMatch(assignmentOverlapErrorRegex);
            expect(assignmentRepository.save).not.toHaveBeenCalled();
        });

        // Test 7: New assignment conflicts with existing ongoing assignment (null dateTo)
        it('should throw error when new assignment conflicts with existing ongoing assignment', async () => {
            const existingAssignment = new Assignment(1, 1, new Date('2025-01-01'), null); // Ongoing
            const assignmentDto = {
                employeeId: '1',
                projectId: '1',
                dateFrom: '2025-02-01', // Would conflict with ongoing assignment
                dateTo: '2025-03-01'
            };
            const assignmentDtos = [assignmentDto];

            // Setup create mock for this specific test
            (assignmentRepository.create as jest.MockedFunction<any>).mockImplementation(() => {
                return new Assignment(parseInt(assignmentDto.employeeId), parseInt(assignmentDto.projectId), new Date(assignmentDto.dateFrom), new Date(assignmentDto.dateTo));
            });

            (assignmentRepository.find as jest.MockedFunction<typeof assignmentRepository.find>).mockResolvedValueOnce([existingAssignment]);

            await expect(assignmentService.saveAll(assignmentDtos)).resolves.toMatch(assignmentOverlapErrorRegex);
            expect(assignmentRepository.save).not.toHaveBeenCalled();
        });

        // Test 8: Multiple assignments with one causing overlap
        it('should throw error when one of multiple assignments causes overlap', async () => {
            // Setup counter for create mock to handle multiple calls
            let createCallCount = 0;
            const assignmentDtos = [
                {
                    employeeId: '1',
                    projectId: '1',
                    dateFrom: '2025-01-01',
                    dateTo: '2025-02-01'
                },
                {
                    employeeId: '2',
                    projectId: '2',
                    dateFrom: '2025-02-15', // Overlaps with existing
                    dateTo: '2025-03-15'
                }
            ];

            (assignmentRepository.create as jest.MockedFunction<any>).mockImplementation(() => {
                const assignmentDto = assignmentDtos[createCallCount];
                const assignment: Assignment = new Assignment(parseInt(assignmentDto.employeeId), parseInt(assignmentDto.projectId), new Date(assignmentDto.dateFrom), new Date(assignmentDto.dateTo));

                createCallCount++;
                return assignment;
            });

            // First assignment has no overlap
            (assignmentRepository.find as jest.MockedFunction<typeof assignmentRepository.find>).mockResolvedValueOnce([]);

            // Second assignment overlaps with existing
            const existingAssignment = new Assignment(2, 2, new Date('2025-02-01'), new Date('2025-03-01'));
            (assignmentRepository.find as jest.MockedFunction<typeof assignmentRepository.find>).mockResolvedValueOnce([existingAssignment]);

            await expect(assignmentService.saveAll(assignmentDtos)).resolves.toMatch(assignmentOverlapErrorRegex);
            expect(assignmentRepository.save).not.toHaveBeenCalled();
        });

        // Test 9: Overlapping assignments for different employees/projects are allowed
        it('should allow overlapping dates for different employees or projects', async () => {
            // Setup counter for create mock to handle multiple calls
            let createCallCount = 0;
            const assignmentDtos = [
                {
                    employeeId: '1',
                    projectId: '1',
                    dateFrom: '2025-01-01',
                    dateTo: '2025-02-01'
                },
                {
                    employeeId: '2', // Different employee
                    projectId: '1',
                    dateFrom: '2025-01-15', // Overlapping dates allowed for different employee
                    dateTo: '2025-02-15'
                },
                {
                    employeeId: '1',
                    projectId: '2', // Different project
                    dateFrom: '2025-01-15', // Overlapping dates allowed for different project
                    dateTo: '2025-02-15'
                }
            ];

            (assignmentRepository.create as jest.MockedFunction<any>).mockImplementation(() => {
                const assignmentDto = assignmentDtos[createCallCount];
                let assignment: Assignment = new Assignment(parseInt(assignmentDto.employeeId), parseInt(assignmentDto.projectId), new Date(assignmentDto.dateFrom), new Date(assignmentDto.dateTo));

                createCallCount++;
                return assignment;
            });

            // Mock find to return no overlapping assignments (different employee or project)
            (assignmentRepository.find as jest.MockedFunction<typeof assignmentRepository.find>).mockResolvedValue([]);

            await expect(assignmentService.saveAll(assignmentDtos)).resolves.not.toThrow();
            expect(assignmentRepository.save).toHaveBeenCalled();
        });

        // Test 10: Back-to-back assignments with no gap are allowed
        it('should allow back-to-back assignments with no gap', async () => {
            const assignmentDto = {
                employeeId: '1',
                projectId: '1',
                dateFrom: '2025-02-01', // Starts exactly when previous ends (no overlap)
                dateTo: '2025-03-01'
            };
            const assignmentDtos = [assignmentDto];

            // Setup create mock for this specific test
            (assignmentRepository.create as jest.MockedFunction<any>).mockImplementation(() => {
                return new Assignment(parseInt(assignmentDto.employeeId), parseInt(assignmentDto.projectId), new Date(assignmentDto.dateFrom), new Date(assignmentDto.dateTo));
            });

            (assignmentRepository.find as jest.MockedFunction<typeof assignmentRepository.find>).mockResolvedValue([]);

            await expect(assignmentService.saveAll(assignmentDtos)).resolves.not.toThrow();
            expect(assignmentRepository.save).toHaveBeenCalled();
        });
    });
});
