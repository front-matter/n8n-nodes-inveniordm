/* eslint-disable @typescript-eslint/no-explicit-any */
import { Inveniordm } from '../../nodes/inveniordm/Inveniordm.node';

describe('Inveniordm Node - Execute Method Tests', () => {
	let node: Inveniordm;

	beforeEach(() => {
		node = new Inveniordm();
	});

	describe('loadOptions method - getResourceTypes', () => {
		it('should exist and be callable', () => {
			expect(node.methods?.loadOptions?.getResourceTypes).toBeDefined();
			expect(typeof node.methods?.loadOptions?.getResourceTypes).toBe('function');
		});

		it('should process resource types response correctly', async () => {
			const mockContext = {
				getCredentials: jest.fn().mockResolvedValue({ baseUrl: 'https://test.example.org/api' }),
				helpers: {
					httpRequestWithAuthentication: {
						call: jest.fn().mockResolvedValue({
							hits: {
								hits: [
									{ id: 'publication-article', title: { en: 'Article' } },
									{ id: 'dataset', title: { en: 'Dataset' } },
									{ id: 'software' }, // No title property
								],
							},
						}),
					},
				},
				getNode: jest.fn(),
			};

			const result = await node.methods!.loadOptions!.getResourceTypes.call(mockContext as any);

			expect(result).toEqual([
				{ name: 'Article', value: 'publication-article' },
				{ name: 'Dataset', value: 'dataset' },
				{ name: 'software', value: 'software' }, // Falls back to id when no title
			]);

			expect(mockContext.helpers.httpRequestWithAuthentication.call).toHaveBeenCalledWith(
				mockContext,
				'inveniordmApi',
				{
					method: 'GET',
					url: 'https://test.example.org/api/vocabularies/resourcetypes',
				}
			);
		});

		it('should handle empty response', async () => {
			const mockContext = {
				getCredentials: jest.fn().mockResolvedValue({ baseUrl: 'https://test.example.org/api' }),
				helpers: {
					httpRequestWithAuthentication: {
						call: jest.fn().mockResolvedValue({}),
					},
				},
				getNode: jest.fn(),
			};

			const result = await node.methods!.loadOptions!.getResourceTypes.call(mockContext as any);
			expect(result).toEqual([]);
		});

		it('should throw NodeOperationError on API failure', async () => {
			const mockContext = {
				getCredentials: jest.fn().mockResolvedValue({ baseUrl: 'https://test.example.org/api' }),
				helpers: {
					httpRequestWithAuthentication: {
						call: jest.fn().mockRejectedValue(new Error('Network error')),
					},
				},
				getNode: jest.fn().mockReturnValue({ id: 'test-node' }),
			};

			await expect(
				node.methods!.loadOptions!.getResourceTypes.call(mockContext as any)
			).rejects.toThrow('Failed to load resource types from https://test.example.org/api/vocabularies/resourcetypes: Error: Network error');
		});
	});

	describe('execute method functionality', () => {
		describe('parameter handling and basic flow control', () => {
			it('should call getNodeParameter with correct parameters for record operations', async () => {
				const mockContext = {
					getInputData: jest.fn().mockReturnValue([{ json: {} }]),
					getNodeParameter: jest.fn()
						.mockReturnValueOnce('record')  // resource
						.mockReturnValueOnce('get')     // operation  
						.mockReturnValueOnce('test-id'), // recordId
					getCredentials: jest.fn().mockResolvedValue({ baseUrl: 'https://test.example.org/api' }),
					helpers: {
						httpRequestWithAuthentication: {
							call: jest.fn().mockResolvedValue({ id: 'test-id', title: 'Test' }),
						},
					},
					logger: {
						info: jest.fn(),
					},
					getNode: jest.fn(),
					continueOnFail: jest.fn().mockReturnValue(false),
				};

				await node.execute.call(mockContext as any);

				expect(mockContext.getNodeParameter).toHaveBeenCalledWith('resource', 0);
				expect(mockContext.getNodeParameter).toHaveBeenCalledWith('operation', 0);
				expect(mockContext.getNodeParameter).toHaveBeenCalledWith('recordId', 0);
			});

			it('should handle multiple input items correctly', async () => {
				const mockContext = {
					getInputData: jest.fn().mockReturnValue([{ json: {} }, { json: {} }]),
					getNodeParameter: jest.fn()
						.mockReturnValueOnce('record').mockReturnValueOnce('get').mockReturnValueOnce('id1')
						.mockReturnValueOnce('record').mockReturnValueOnce('get').mockReturnValueOnce('id2'),
					getCredentials: jest.fn().mockResolvedValue({ baseUrl: 'https://test.example.org/api' }),
					helpers: {
						httpRequestWithAuthentication: {
							call: jest.fn()
								.mockResolvedValueOnce({ id: 'id1', title: 'Record 1' })
								.mockResolvedValueOnce({ id: 'id2', title: 'Record 2' }),
						},
					},
					logger: {
						info: jest.fn(),
					},
					getNode: jest.fn(),
					continueOnFail: jest.fn().mockReturnValue(false),
				};

				const result = await node.execute.call(mockContext as any);

				expect(result[0]).toHaveLength(2);
				expect(mockContext.helpers.httpRequestWithAuthentication.call).toHaveBeenCalledTimes(2);
			});
		});

		describe('record operations - URL and request construction', () => {
			it('should construct correct GET request for record operation', async () => {
				const mockContext = {
					getInputData: jest.fn().mockReturnValue([{ json: {} }]),
					getNodeParameter: jest.fn()
						.mockReturnValueOnce('record')
						.mockReturnValueOnce('get') 
						.mockReturnValueOnce('123'),
					getCredentials: jest.fn().mockResolvedValue({ baseUrl: 'https://test.example.org/api' }),
					helpers: {
						httpRequestWithAuthentication: {
							call: jest.fn().mockResolvedValue({ id: '123' }),
						},
					},
					logger: {
						info: jest.fn(),
					},
					getNode: jest.fn(),
					continueOnFail: jest.fn().mockReturnValue(false),
				};

				await node.execute.call(mockContext as any);

				expect(mockContext.helpers.httpRequestWithAuthentication.call).toHaveBeenCalledWith(
					mockContext,
					'inveniordmApi',
					{
						method: 'GET',
						url: 'https://test.example.org/api/records/123',
					}
				);
			});

			it('should handle getMany with query parameters', async () => {
				const mockContext = {
					getInputData: jest.fn().mockReturnValue([{ json: {} }]),
					getNodeParameter: jest.fn()
						.mockReturnValueOnce('record')
						.mockReturnValueOnce('getMany')
						.mockReturnValueOnce(false) // returnAll
						.mockReturnValueOnce({ q: 'test query', sort: 'newest' }) // additionalFields
						.mockReturnValueOnce(10), // limit
					getCredentials: jest.fn().mockResolvedValue({ baseUrl: 'https://test.example.org/api' }),
					helpers: {
						httpRequestWithAuthentication: {
							call: jest.fn().mockResolvedValue({
								hits: {
									hits: Array(5).fill(null).map((_, i) => ({ id: i, title: `Record ${i}` }))
								}
							}),
						},
					},
					logger: {
						info: jest.fn(),
					},
					getNode: jest.fn(),
					continueOnFail: jest.fn().mockReturnValue(false),
				};

				await node.execute.call(mockContext as any);

				expect(mockContext.helpers.httpRequestWithAuthentication.call).toHaveBeenCalledWith(
					mockContext,
					'inveniordmApi',
					{
						method: 'GET',
						url: 'https://test.example.org/api/records?q=test%20query&sort=newest&size=10',
					}
				);
			});

			it('should handle returnAll=true for getMany', async () => {
				const mockContext = {
					getInputData: jest.fn().mockReturnValue([{ json: {} }]),
					getNodeParameter: jest.fn()
						.mockReturnValueOnce('record')
						.mockReturnValueOnce('getMany')
						.mockReturnValueOnce(true) // returnAll
						.mockReturnValueOnce({}), // additionalFields
					getCredentials: jest.fn().mockResolvedValue({ baseUrl: 'https://test.example.org/api' }),
					helpers: {
						httpRequestWithAuthentication: {
							call: jest.fn().mockResolvedValue({
								hits: {
									hits: Array(3).fill(null).map((_, i) => ({ id: i, title: `Record ${i}` }))
								}
							}),
						},
					},
					logger: {
						info: jest.fn(),
					},
					getNode: jest.fn(),
					continueOnFail: jest.fn().mockReturnValue(false),
				};

				const result = await node.execute.call(mockContext as any);

				expect(result[0]).toHaveLength(3); // All returned when returnAll=true
			});

			it('should construct correct POST request for create operation', async () => {
				const recordData = { metadata: { title: 'Test Record' } };
				const mockContext = {
					getInputData: jest.fn().mockReturnValue([{ json: {} }]),
					getNodeParameter: jest.fn()
						.mockReturnValueOnce('record')
						.mockReturnValueOnce('create')
						.mockReturnValueOnce(JSON.stringify(recordData)),
					getCredentials: jest.fn().mockResolvedValue({ baseUrl: 'https://test.example.org/api' }),
					helpers: {
						httpRequestWithAuthentication: {
							call: jest.fn().mockResolvedValue({ id: '123', ...recordData }),
						},
					},
					logger: {
						info: jest.fn(),
					},
					getNode: jest.fn(),
					continueOnFail: jest.fn().mockReturnValue(false),
				};

				await node.execute.call(mockContext as any);

				expect(mockContext.helpers.httpRequestWithAuthentication.call).toHaveBeenCalledWith(
					mockContext,
					'inveniordmApi',
					{
						method: 'POST',
						url: 'https://test.example.org/api/records',
						body: recordData,
					}
				);
			});

			it('should construct correct PUT request for update operation', async () => {
				const recordData = { metadata: { title: 'Updated Record' } };
				const mockContext = {
					getInputData: jest.fn().mockReturnValue([{ json: {} }]),
					getNodeParameter: jest.fn()
						.mockReturnValueOnce('record')
						.mockReturnValueOnce('update')
						.mockReturnValueOnce('123')
						.mockReturnValueOnce(JSON.stringify(recordData)),
					getCredentials: jest.fn().mockResolvedValue({ baseUrl: 'https://test.example.org/api' }),
					helpers: {
						httpRequestWithAuthentication: {
							call: jest.fn().mockResolvedValue({ id: '123', ...recordData }),
						},
					},
					logger: {
						info: jest.fn(),
					},
					getNode: jest.fn(),
					continueOnFail: jest.fn().mockReturnValue(false),
				};

				await node.execute.call(mockContext as any);

				expect(mockContext.helpers.httpRequestWithAuthentication.call).toHaveBeenCalledWith(
					mockContext,
					'inveniordmApi',
					{
						method: 'PUT',
						url: 'https://test.example.org/api/records/123',
						body: recordData,
					}
				);
			});

			it('should construct correct DELETE request for delete operation', async () => {
				const mockContext = {
					getInputData: jest.fn().mockReturnValue([{ json: {} }]),
					getNodeParameter: jest.fn()
						.mockReturnValueOnce('record')
						.mockReturnValueOnce('delete')
						.mockReturnValueOnce('123'),
					getCredentials: jest.fn().mockResolvedValue({ baseUrl: 'https://test.example.org/api' }),
					helpers: {
						httpRequestWithAuthentication: {
							call: jest.fn().mockResolvedValue(undefined),
						},
					},
					logger: {
						info: jest.fn(),
					},
					getNode: jest.fn(),
					continueOnFail: jest.fn().mockReturnValue(false),
				};

				const result = await node.execute.call(mockContext as any);

				expect(mockContext.helpers.httpRequestWithAuthentication.call).toHaveBeenCalledWith(
					mockContext,
					'inveniordmApi',
					{
						method: 'DELETE',
						url: 'https://test.example.org/api/records/123',
					}
				);
				expect(result).toEqual([[{ json: { success: true, id: '123' } }]]);
			});
		});

		describe('community operations - URL construction', () => {
			it('should construct correct GET request for community operation', async () => {
				const mockContext = {
					getInputData: jest.fn().mockReturnValue([{ json: {} }]),
					getNodeParameter: jest.fn()
						.mockReturnValueOnce('community')
						.mockReturnValueOnce('get')
						.mockReturnValueOnce('community-123'),
					getCredentials: jest.fn().mockResolvedValue({ baseUrl: 'https://test.example.org/api' }),
					helpers: {
						httpRequestWithAuthentication: {
							call: jest.fn().mockResolvedValue({ id: 'community-123' }),
						},
					},
					logger: {
						info: jest.fn(),
					},
					getNode: jest.fn(),
					continueOnFail: jest.fn().mockReturnValue(false),
				};

				await node.execute.call(mockContext as any);

				expect(mockContext.helpers.httpRequestWithAuthentication.call).toHaveBeenCalledWith(
					mockContext,
					'inveniordmApi',
					{
						method: 'GET',
						url: 'https://test.example.org/api/communities/community-123',
					}
				);
			});

			it('should handle community getMany operation', async () => {
				const mockContext = {
					getInputData: jest.fn().mockReturnValue([{ json: {} }]),
					getNodeParameter: jest.fn()
						.mockReturnValueOnce('community')
						.mockReturnValueOnce('getMany')
						.mockReturnValueOnce(false) // returnAll
						.mockReturnValueOnce({ q: 'science' }) // additionalFields
						.mockReturnValueOnce(5), // limit
					getCredentials: jest.fn().mockResolvedValue({ baseUrl: 'https://test.example.org/api' }),
					helpers: {
						httpRequestWithAuthentication: {
							call: jest.fn().mockResolvedValue({
								hits: {
									hits: Array(2).fill(null).map((_, i) => ({ id: i, title: `Community ${i}` }))
								}
							}),
						},
					},
					logger: {
						info: jest.fn(),
					},
					getNode: jest.fn(),
					continueOnFail: jest.fn().mockReturnValue(false),
				};

				await node.execute.call(mockContext as any);

				expect(mockContext.helpers.httpRequestWithAuthentication.call).toHaveBeenCalledWith(
					mockContext,
					'inveniordmApi',
					{
						method: 'GET',
						url: 'https://test.example.org/api/communities?q=science&size=5',
					}
				);
			});

			it('should construct correct GET request for community getRecords operation', async () => {
				const mockContext = {
					getInputData: jest.fn().mockReturnValue([{ json: {} }]),
					getNodeParameter: jest.fn()
						.mockReturnValueOnce('community')
						.mockReturnValueOnce('getRecords')
						.mockReturnValueOnce('front_matter')
						.mockReturnValueOnce(false) // returnAll
						.mockReturnValueOnce({ q: 'test', sort: 'newest' }) // additionalFields
						.mockReturnValueOnce(10), // limit
					getCredentials: jest.fn().mockResolvedValue({ baseUrl: 'https://test.example.org/api' }),
					helpers: {
						httpRequestWithAuthentication: {
							call: jest.fn().mockResolvedValue({
								hits: {
									hits: Array(3).fill(null).map((_, i) => ({ id: i, title: `Record ${i}` }))
								}
							}),
						},
					},
					logger: {
						info: jest.fn(),
					},
					getNode: jest.fn(),
					continueOnFail: jest.fn().mockReturnValue(false),
				};

				await node.execute.call(mockContext as any);

				expect(mockContext.helpers.httpRequestWithAuthentication.call).toHaveBeenCalledWith(
					mockContext,
					'inveniordmApi',
					{
						method: 'GET',
						url: 'https://test.example.org/api/communities/front_matter/records?l=list&p=1&q=test&sort=newest&s=10',
					}
				);
			});

			it('should use default sort for community getRecords when not specified', async () => {
				const mockContext = {
					getInputData: jest.fn().mockReturnValue([{ json: {} }]),
					getNodeParameter: jest.fn()
						.mockReturnValueOnce('community')
						.mockReturnValueOnce('getRecords')
						.mockReturnValueOnce('front_matter')
						.mockReturnValueOnce(false) // returnAll
						.mockReturnValueOnce({}) // additionalFields - no sort
						.mockReturnValueOnce(5), // limit
					getCredentials: jest.fn().mockResolvedValue({ baseUrl: 'https://test.example.org/api' }),
					helpers: {
						httpRequestWithAuthentication: {
							call: jest.fn().mockResolvedValue({
								hits: {
									hits: Array(2).fill(null).map((_, i) => ({ id: i, title: `Record ${i}` }))
								}
							}),
						},
					},
					logger: {
						info: jest.fn(),
					},
					getNode: jest.fn(),
					continueOnFail: jest.fn().mockReturnValue(false),
				};

				await node.execute.call(mockContext as any);

				expect(mockContext.helpers.httpRequestWithAuthentication.call).toHaveBeenCalledWith(
					mockContext,
					'inveniordmApi',
					{
						method: 'GET',
						url: 'https://test.example.org/api/communities/front_matter/records?l=list&p=1&sort=newest&s=5',
					}
				);
			});

			it('should handle returnAll=true for community getRecords', async () => {
				const mockContext = {
					getInputData: jest.fn().mockReturnValue([{ json: {} }]),
					getNodeParameter: jest.fn()
						.mockReturnValueOnce('community')
						.mockReturnValueOnce('getRecords')
						.mockReturnValueOnce('front_matter')
						.mockReturnValueOnce(true) // returnAll
						.mockReturnValueOnce({}), // additionalFields
					getCredentials: jest.fn().mockResolvedValue({ baseUrl: 'https://test.example.org/api' }),
					helpers: {
						httpRequestWithAuthentication: {
							call: jest.fn().mockResolvedValue({
								hits: {
									hits: Array(15).fill(null).map((_, i) => ({ id: i, title: `Record ${i}` }))
								}
							}),
						},
					},
					logger: {
						info: jest.fn(),
					},
					getNode: jest.fn(),
					continueOnFail: jest.fn().mockReturnValue(false),
				};

				const result = await node.execute.call(mockContext as any);

				expect(result[0]).toHaveLength(15); // All returned when returnAll=true
				expect(mockContext.helpers.httpRequestWithAuthentication.call).toHaveBeenCalledWith(
					mockContext,
					'inveniordmApi',
					expect.objectContaining({
						method: 'GET',
						url: expect.stringContaining('s=10'), // Default size when returnAll
					})
				);
			});
		});

		describe('error handling', () => {
			it('should handle JSON parse errors in create/update operations', async () => {
				const mockContext = {
					getInputData: jest.fn().mockReturnValue([{ json: {} }]),
					getNodeParameter: jest.fn()
						.mockReturnValueOnce('record')
						.mockReturnValueOnce('create')
						.mockReturnValueOnce('{ invalid json syntax }'), // Invalid JSON
					getCredentials: jest.fn().mockResolvedValue({ baseUrl: 'https://test.example.org/api' }),
					helpers: {
						httpRequestWithAuthentication: {
							call: jest.fn(),
						},
					},
					logger: {
						info: jest.fn(),
					},
					getNode: jest.fn(),
					continueOnFail: jest.fn().mockReturnValue(false),
				};

				await expect(node.execute.call(mockContext as any)).rejects.toThrow('Invalid JSON in Record Data field');
			});

			it('should handle continueOnFail=true when errors occur', async () => {
				const mockContext = {
					getInputData: jest.fn().mockReturnValue([{ json: {} }]),
					getNodeParameter: jest.fn()
						.mockReturnValueOnce('record')
						.mockReturnValueOnce('get')
						.mockReturnValueOnce('123'),
					getCredentials: jest.fn().mockResolvedValue({ baseUrl: 'https://test.example.org/api' }),
					helpers: {
						httpRequestWithAuthentication: {
							call: jest.fn().mockRejectedValue(new Error('API Error')),
						},
					},
					logger: {
						info: jest.fn(),
					},
					getNode: jest.fn(),
					continueOnFail: jest.fn().mockReturnValue(true),
				};

				const result = await node.execute.call(mockContext as any);

				expect(result).toEqual([[{
					json: { error: 'API Error' },
					pairedItem: { item: 0 },
				}]]);
			});

			it('should handle array and object response data correctly', async () => {
				const arrayData = [{ id: '1' }, { id: '2' }];
				const mockContext = {
					getInputData: jest.fn().mockReturnValue([{ json: {} }]),
					getNodeParameter: jest.fn()
						.mockReturnValueOnce('record')
						.mockReturnValueOnce('get')
						.mockReturnValueOnce('123'),
					getCredentials: jest.fn().mockResolvedValue({ baseUrl: 'https://test.example.org/api' }),
					helpers: {
						httpRequestWithAuthentication: {
							call: jest.fn().mockResolvedValue(arrayData),
						},
					},
					logger: {
						info: jest.fn(),
					},
					getNode: jest.fn(),
					continueOnFail: jest.fn().mockReturnValue(false),
				};

				const result = await node.execute.call(mockContext as any);
				
				expect(result).toBeDefined();
				expect(Array.isArray(result)).toBe(true);
				expect(Array.isArray(result[0])).toBe(true);
			});

			it('should handle hits response structure for getMany operations correctly', async () => {
				const mockResponse = {
					hits: {
						hits: [
							{ id: '1', title: 'Record 1' },
							{ id: '2', title: 'Record 2' },
							{ id: '3', title: 'Record 3' },
						],
					},
				};

				const mockContext = {
					getInputData: jest.fn().mockReturnValue([{ json: {} }]),
					getNodeParameter: jest.fn()
						.mockReturnValueOnce('record')
						.mockReturnValueOnce('getMany')
						.mockReturnValueOnce(false) // returnAll
						.mockReturnValueOnce({}) // additionalFields
						.mockReturnValueOnce(2), // limit
					getCredentials: jest.fn().mockResolvedValue({ baseUrl: 'https://test.example.org/api' }),
					helpers: {
						httpRequestWithAuthentication: {
							call: jest.fn().mockResolvedValue(mockResponse),
						},
					},
					logger: {
						info: jest.fn(),
					},
					getNode: jest.fn(),
					continueOnFail: jest.fn().mockReturnValue(false),
				};

				const result = await node.execute.call(mockContext as any);

				// With limit=2, should return only 2 items even though 3 are available
				expect(result[0]).toHaveLength(2);
			});
		});
	});
});