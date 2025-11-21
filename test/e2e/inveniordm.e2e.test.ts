/* eslint-disable no-console */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { Inveniordm } from '../../nodes/inveniordm/Inveniordm.node';

/**
 * End-to-End Tests for InvenioRDM Node with Real APIs
 * 
 * These tests connect to actual InvenioRDM instances to verify integration.
 * They are designed to be non-destructive (read-only operations) when possible.
 * 
 * Environment Variables (optional):
 * - INVENIORDM_BASE_URL: Base URL of InvenioRDM instance (default: https://zenodo.org)
 * - INVENIORDM_ACCESS_TOKEN: Access token for authenticated operations
 * - RUN_E2E_TESTS: Set to 'true' to enable these tests (default: false)
 */

// E2E test configuration - can be controlled via environment or direct modification
// Environment variables (if available): RUN_E2E_TESTS, INVENIORDM_BASE_URL, INVENIORDM_ACCESS_TOKEN
// Or modify these constants directly:
// eslint-disable-next-line @n8n/community-nodes/no-restricted-globals
const SHOULD_RUN_E2E = process.env.RUN_E2E_TESTS === 'true' || false; // Change to true to enable E2E tests
const BASE_URL = 'https://inveniordm.web.cern.ch'; // Change to your InvenioRDM instance URL
const ACCESS_TOKEN = ''; // Add your access token here if needed

// Skip E2E tests by default to avoid hitting real APIs in CI
const describeE2E = SHOULD_RUN_E2E ? describe : describe.skip;

describeE2E('InvenioRDM Node - E2E Tests with Real APIs', () => {
	let node: Inveniordm;

	beforeAll(() => {
		if (SHOULD_RUN_E2E) {
			console.log(`🌐 Running E2E tests against: ${BASE_URL}`);
			console.log(`🔑 Using authentication: ${ACCESS_TOKEN ? 'Yes' : 'No (read-only)'}`);
		}
	});

	beforeEach(() => {
		node = new Inveniordm();
	});

	describe('loadOptions - getResourceTypes with Real API', () => {
		it('should fetch actual resource types from InvenioRDM Demo Site', async () => {
			const mockContext = {
				helpers: {
					httpRequestWithAuthentication: {
						call: async (context: any, credentialType: string, requestOptions: any) => {
							// Make real HTTP request
							const url = `${BASE_URL}${requestOptions.url}`;
							console.log(`📡 Fetching: ${url}`);
							
							const response = await fetch(url, {
								method: requestOptions.method,
								headers: {
									'Accept': 'application/json',
									'Content-Type': 'application/json',
									...(ACCESS_TOKEN ? { 'Authorization': `Bearer ${ACCESS_TOKEN}` } : {}),
								},
							});

							if (!response.ok) {
								throw new Error(`HTTP ${response.status}: ${response.statusText}`);
							}

							return await response.json();
						},
					},
				},
				getNode: jest.fn().mockReturnValue({ id: 'e2e-test-node' }),
			};

			const result = await node.methods!.loadOptions!.getResourceTypes.call(mockContext as any);

			// Verify we got real data
			expect(result).toBeDefined();
			expect(Array.isArray(result)).toBe(true);
			expect(result.length).toBeGreaterThan(0);
			
			// Common resource types that should exist
			const values = result.map(item => item.value);
			expect(values).toContain('publication-article');
			
			console.log(`✅ Found ${result.length} resource types:`, values.slice(0, 5));
		}, 30000); // 30 second timeout for network requests
	});

	describe('Records API - Read Operations', () => {
		it('should fetch public records from InvenioRDM Demo Site', async () => {
		const mockContext = {
			getInputData: jest.fn().mockReturnValue([{ json: {} }]),
			getNodeParameter: jest.fn()
				.mockReturnValueOnce('record')  // resource
				.mockReturnValueOnce('getMany') // operation
				.mockReturnValueOnce(false)     // returnAll
				.mockReturnValueOnce({}) // additionalFields - simplified to avoid query issues
				.mockReturnValueOnce(3),        // limit - reduced for faster testing
			helpers: {
				httpRequestWithAuthentication: {
					call: async (context: any, credentialType: string, requestOptions: any) => {
						const url = `${BASE_URL}${requestOptions.url}`;
						const queryParams = new URLSearchParams(requestOptions.qs || {}).toString();
						const fullUrl = queryParams ? `${url}?${queryParams}` : url;
						
						console.log(`📡 Fetching records: ${fullUrl}`);
						
						const response = await fetch(fullUrl, {
							method: requestOptions.method,
							headers: {
								'Accept': 'application/json',
								'Content-Type': 'application/json',
								...(ACCESS_TOKEN ? { 'Authorization': `Bearer ${ACCESS_TOKEN}` } : {}),
							},
						});

						if (!response.ok) {
							throw new Error(`HTTP ${response.status}: ${response.statusText}`);
						}

						return await response.json();
					},
				},
			},
			getNode: jest.fn().mockReturnValue({ id: 'e2e-test-node' }),
			continueOnFail: jest.fn().mockReturnValue(false),
		};

		const result = await node.execute.call(mockContext as any);

		// Verify we got real records
		expect(result).toBeDefined();
		expect(Array.isArray(result)).toBe(true);
		expect(Array.isArray(result[0])).toBe(true);
		expect(result[0].length).toBeGreaterThan(0);
		expect(result[0].length).toBeLessThanOrEqual(3); // Respects limit

		// Verify record structure
		const firstRecord = result[0][0];
		expect(firstRecord).toHaveProperty('json');
		expect(firstRecord.json).toHaveProperty('id');
		expect(firstRecord.json).toHaveProperty('metadata');

		console.log(`✅ Fetched ${result[0].length} records. First record ID: ${firstRecord.json.id}`);
	}, 30000);		it('should fetch a specific public record by ID', async () => {
			// Use a known record ID from InvenioRDM Demo Site
			const recordId = 'ebndp-45878'; // Known public record on demo instance

			// Now test fetching that specific record
			const getContext = {
				getInputData: jest.fn().mockReturnValue([{ json: {} }]),
				getNodeParameter: jest.fn()
					.mockReturnValueOnce('record')
					.mockReturnValueOnce('get')
					.mockReturnValueOnce(recordId),
				helpers: {
					httpRequestWithAuthentication: {
						call: async (context: any, credentialType: string, requestOptions: any) => {
							const url = `${BASE_URL}${requestOptions.url}`;
							console.log(`📡 Fetching specific record: ${url}`);
							
							const response = await fetch(url, {
								method: requestOptions.method,
								headers: { 'Accept': 'application/json' },
							});

							if (!response.ok) {
								throw new Error(`HTTP ${response.status}: ${response.statusText}`);
							}

							return await response.json();
						},
					},
				},
				getNode: jest.fn(),
				continueOnFail: jest.fn().mockReturnValue(false),
			};

			const result = await node.execute.call(getContext as any);

			// Verify we got the specific record
			expect(result).toBeDefined();
			expect(result[0]).toHaveLength(1);
			expect(result[0][0].json.id).toBe(recordId);
			expect(result[0][0].json).toHaveProperty('metadata');

			console.log(`✅ Successfully fetched record ${recordId}`);
		}, 30000);
	});

	describe('Communities API - Read Operations', () => {
		it('should fetch public communities from InvenioRDM', async () => {
			const mockContext = {
				getInputData: jest.fn().mockReturnValue([{ json: {} }]),
				getNodeParameter: jest.fn()
					.mockReturnValueOnce('community') // resource
					.mockReturnValueOnce('getMany')   // operation
					.mockReturnValueOnce(false)       // returnAll
					.mockReturnValueOnce({})          // additionalFields
					.mockReturnValueOnce(3),          // limit
				helpers: {
					httpRequestWithAuthentication: {
						call: async (context: any, credentialType: string, requestOptions: any) => {
							const url = `${BASE_URL}${requestOptions.url}`;
							const queryParams = new URLSearchParams(requestOptions.qs || {}).toString();
							const fullUrl = queryParams ? `${url}?${queryParams}` : url;
							
							console.log(`📡 Fetching communities: ${fullUrl}`);
							
							const response = await fetch(fullUrl, {
								method: requestOptions.method,
								headers: { 'Accept': 'application/json' },
							});

							if (!response.ok) {
								throw new Error(`HTTP ${response.status}: ${response.statusText}`);
							}

							return await response.json();
						},
					},
				},
				getNode: jest.fn().mockReturnValue({ id: 'e2e-test-node' }),
				continueOnFail: jest.fn().mockReturnValue(false),
			};

			const result = await node.execute.call(mockContext as any);

			// Verify we got communities (some instances might not have public communities)
			expect(result).toBeDefined();
			expect(Array.isArray(result)).toBe(true);
			expect(Array.isArray(result[0])).toBe(true);

			if (result[0].length > 0) {
				expect(result[0][0]).toHaveProperty('json');
				expect(result[0][0].json).toHaveProperty('id');
				console.log(`✅ Found ${result[0].length} communities`);
			} else {
				console.log('ℹ️  No public communities found (this is normal for some instances)');
			}
		}, 30000);
	});

	describe('Error Handling with Real APIs', () => {
		it('should handle 404 errors gracefully', async () => {
			const mockContext = {
				getInputData: jest.fn().mockReturnValue([{ json: {} }]),
				getNodeParameter: jest.fn()
					.mockReturnValueOnce('record')
					.mockReturnValueOnce('get')
					.mockReturnValueOnce('non-existent-record-id-12345'),
				helpers: {
					httpRequestWithAuthentication: {
						call: async (context: any, credentialType: string, requestOptions: any) => {
							const url = `${BASE_URL}${requestOptions.url}`;
							
							const response = await fetch(url, {
								method: requestOptions.method,
								headers: { 'Accept': 'application/json' },
							});

							if (!response.ok) {
								throw new Error(`HTTP ${response.status}: ${response.statusText}`);
							}

							return await response.json();
						},
					},
				},
				getNode: jest.fn().mockReturnValue({ id: 'e2e-test-node' }),
				continueOnFail: jest.fn().mockReturnValue(false),
			};

			await expect(node.execute.call(mockContext as any))
				.rejects
				.toThrow(/HTTP 404/);

			console.log('✅ 404 error handling works correctly');
		}, 15000);

		it('should handle network errors', async () => {
			const mockContext = {
				getInputData: jest.fn().mockReturnValue([{ json: {} }]),
				getNodeParameter: jest.fn()
					.mockReturnValueOnce('record')
					.mockReturnValueOnce('get')
					.mockReturnValueOnce('test-id'),
				helpers: {
					httpRequestWithAuthentication: {
						call: async () => {
							// Simulate network error without using restricted globals
							throw new Error('Network timeout');
						},
					},
				},
				getNode: jest.fn().mockReturnValue({ id: 'e2e-test-node' }),
				continueOnFail: jest.fn().mockReturnValue(false),
			};

			await expect(node.execute.call(mockContext as any))
				.rejects
				.toThrow(/timeout/i);

			console.log('✅ Network timeout handling works correctly');
		}, 5000);
	});

	describe('Authentication Tests', () => {
		const runIfAuthenticated = ACCESS_TOKEN ? it : it.skip;

		runIfAuthenticated('should work with authenticated requests', async () => {
			const mockContext = {
				getInputData: jest.fn().mockReturnValue([{ json: {} }]),
				getNodeParameter: jest.fn()
					.mockReturnValueOnce('record')
					.mockReturnValueOnce('getMany')
					.mockReturnValueOnce(false)
					.mockReturnValueOnce({})
					.mockReturnValueOnce(2),
				helpers: {
					httpRequestWithAuthentication: {
						call: async (context: any, credentialType: string, requestOptions: any) => {
							const url = `${BASE_URL}${requestOptions.url}`;
							
							const response = await fetch(url, {
								method: requestOptions.method,
								headers: {
									'Accept': 'application/json',
									'Authorization': `Bearer ${ACCESS_TOKEN}`,
								},
							});

							if (!response.ok) {
								throw new Error(`HTTP ${response.status}: ${response.statusText}`);
							}

							return await response.json();
						},
					},
				},
				getNode: jest.fn().mockReturnValue({ id: 'e2e-test-node' }),
				continueOnFail: jest.fn().mockReturnValue(false),
			};

			const result = await node.execute.call(mockContext as any);

			expect(result).toBeDefined();
			console.log('✅ Authenticated requests work correctly');
		}, 30000);
	});
});

// Helper to run E2E tests manually
if (require.main === module) {
	console.log('🧪 Running E2E tests manually...');
	console.log('Set RUN_E2E_TESTS=true to enable in Jest');
}