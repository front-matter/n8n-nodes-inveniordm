import type {
	IDataObject,
	IExecuteFunctions,
	ILoadOptionsFunctions,
	INodeExecutionData,
	INodePropertyOptions,
	INodeType,
	INodeTypeDescription,
	JsonObject,
	Icon,
} from 'n8n-workflow';
import { NodeApiError, NodeOperationError } from 'n8n-workflow';

interface QueryParameters extends IDataObject {
	q?: string;  // search query string
  sort?: string;
  size?: number;
  page?: number;
  f?: string;  // filter, e.g., language:eng
  l?: string;  // list format
  p?: number;  // page number (alternative to page)
  s?: number;  // size (alternative to size)
}

interface RecordData {
	metadata: {
		title: string;
		description?: string;
		creators?: Array<{
			person_or_org: {
				type: string;
				name: string;
				given_name?: string;
				family_name?: string;
			};
		}>;
		resource_type: {
			id: string;
		};
    publication_date: string;
	};
}

interface InvenioRDMCredentials {
	baseUrl?: string;
	accessToken?: string;
}

export class Inveniordm implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'InvenioRDM',
		name: 'inveniordm',
		icon: { light: 'file:../../icons/invenio-rdm.svg', dark: 'file:../../icons/invenio-rdm.dark.svg' } as Icon,
		group: ['output'],
		version: 1,
		subtitle: '={{$parameter["operation"] + ": " + $parameter["resource"]}}',
		description: 'Interact with InvenioRDM API for research data management',
		usableAsTool: true,
		defaults: {
			name: 'InvenioRDM',
		},
		inputs: ['main'],
		outputs: ['main'],
		credentials: [
			{
				name: 'inveniordmApi',
				required: true,
			},
		],
		requestDefaults: {
			baseURL: '={{$credentials?.baseUrl}}',
			headers: {
				Accept: 'application/json',
				'Content-Type': 'application/json',
			},
		},
		properties: [
			{
				displayName: 'Resource',
				name: 'resource',
				type: 'options',
				noDataExpression: true,
				options: [
					{
						name: 'Ping',
						value: 'ping',
					},
					{
						name: 'Record',
						value: 'record',
					},
					{
						name: 'Community',
						value: 'community',
					},
				],
				default: 'record',
			},
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				displayOptions: {
					show: {
						resource: ['record'],
					},
				},
				options: [
					{
						name: 'Create',
						value: 'create',
						description: 'Create a new record',
						action: 'Create a record',
					},
					{
						name: 'Delete',
						value: 'delete',
						description: 'Delete a record',
						action: 'Delete a record',
					},
					{
						name: 'Get',
						value: 'get',
						description: 'Get a single record',
						action: 'Get a record',
					},
					{
						name: 'Get Many',
						value: 'getMany',
						description: 'Get many records',
						action: 'Get many records',
					},
					{
						name: 'Update',
						value: 'update',
						description: 'Update a record',
						action: 'Update a record',
					},
				],
				default: 'get',
			},
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				displayOptions: {
					show: {
						resource: ['ping'],
					},
				},
				options: [
					{
						name: 'Ping',
						value: 'ping',
						description: 'Check connectivity to InvenioRDM API',
						action: 'Ping invenio rdm api',
					},
				],
				default: 'ping',
			},
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				displayOptions: {
					show: {
						resource: ['community'],
					},
				},
				options: [
					{
						name: 'Get',
						value: 'get',
						description: 'Get a single community',
						action: 'Get a community',
					},
					{
						name: 'Get Many',
						value: 'getMany',
						description: 'Get many communities',
						action: 'Get many communities',
					},
					{
						name: 'Get Records',
						value: 'getRecords',
						description: 'Get records from a community',
						action: 'Get records from a community',
					},
				],
				default: 'get',
			},

			// Record operations
			{
				displayName: 'Record ID',
				name: 'recordId',
				type: 'string',
				required: true,
				displayOptions: {
					show: {
						resource: ['record'],
						operation: ['get', 'update', 'delete'],
					},
				},
				default: '',
				description: 'The ID of the record',
			},
			{
				displayName: 'Return All',
				name: 'returnAll',
				type: 'boolean',
				displayOptions: {
					show: {
						resource: ['record', 'community'],
						operation: ['getMany', 'getRecords'],
					},
				},
				default: false,
				description: 'Whether to return all results or only up to a given limit',
			},
			{
				displayName: 'Limit',
				name: 'limit',
				type: 'number',
				displayOptions: {
					show: {
						resource: ['record', 'community'],
						operation: ['getMany', 'getRecords'],
						returnAll: [false],
					},
				},
				typeOptions: {
					minValue: 1,
					maxValue: 1000,
				},
				default: 50,
				description: 'Max number of results to return',
			},
			{
				displayName: 'Additional Fields',
				name: 'additionalFields',
				type: 'collection',
				placeholder: 'Add Field',
				displayOptions: {
					show: {
						resource: ['record', 'community'],
						operation: ['getMany', 'getRecords'],
					},
				},
				default: {},
				options: [
					{
						displayName: 'Query',
						name: 'q',
						type: 'string',
						default: '',
						description: 'Search query string',
					},
					{
						displayName: 'Sort',
						name: 'sort',
						type: 'options',
						options: [
							{
								name: 'Best Match',
								value: 'bestmatch',
							},
              {
								name: 'Least Recently Added',
								value: 'created-asc',
							},
              {
								name: 'Least Recently Updated',
								value: 'updated-asc',
							},
							{
								name: 'Most Viewed',
								value: 'mostviewed',
							},
              {
								name: 'Newest',
								value: 'newest',
							},
							{
								name: 'Oldest',
								value: 'oldest',
							},
              {
								name: 'Recently Added',
								value: 'created-desc',
							},
              {
								name: 'Recently Updated',
								value: 'updated-desc',
							},
						],
						default: 'bestmatch',
						description: 'Sort order for results',
					},
          {
						displayName: 'Page',
						name: 'p',
						type: 'number',
						default: 1,
						description: 'Page number for paginated results',
					},
          {
						displayName: 'Language',
						name: 'f',
						type: 'options',
						options: [
              {
                name: 'English',
                value: 'language:eng',
              },
              {
                name: 'French',
                value: 'language:fra',
              },
              {
                name: 'German',
                value: 'language:deu',
              },
              {
                name: 'Spanish',
                value: 'language:spa',
              },
						],
						default: 'language:eng',
					},
				],
			},

		// Community operations
		{
			displayName: 'Community Slug',
			name: 'communitySlug',
			type: 'string',
			required: true,
			displayOptions: {
				show: {
					resource: ['community'],
					operation: ['get', 'getRecords'],
				},
			},
			default: '',
			description: 'The slug of the community',
		},			// Create/Update record fields
			{
				displayName: 'Record Data',
				name: 'recordData',
				type: 'json',
				displayOptions: {
					show: {
						resource: ['record'],
						operation: ['create', 'update'],
					},
				},
				default: '{\n  "metadata": {\n    "title": "Example Record",\n    "description": "This is an example record",\n    "creators": [\n      {\n        "person_or_org": {\n          "type": "personal",\n          "name": "Doe, John",\n          "given_name": "John",\n          "family_name": "Doe"\n        }\n      }\n    ],\n    "resource_type": {\n      "id": "publication-article"\n    }\n  }\n}',
				description: 'The record data as JSON',
			},
		],
	};

	methods = {
		loadOptions: {
			async getResourceTypes(this: ILoadOptionsFunctions): Promise<INodePropertyOptions[]> {
				const returnData: INodePropertyOptions[] = [];

				// Helper to fix common baseUrl typo
				function normalizeBaseUrl(url: string | undefined): string | undefined {
					if (!url) return url;
					return url.replace(/^https:\s+\/\//i, 'https://');
				}

				function buildUrl(baseUrl: string | undefined, path: string): string {
					const normalized = normalizeBaseUrl(baseUrl);
					if (!normalized) return path;
					return `${normalized.replace(/\/+$/, '')}${path}`;
				}

				const creds = (await this.getCredentials('inveniordmApi')) as InvenioRDMCredentials;
				const requestPath = '/vocabularies/resourcetypes';
				const fullUrl = buildUrl(creds.baseUrl, requestPath);

				try {
					const response = await this.helpers.httpRequestWithAuthentication.call(
						this,
						'inveniordmApi',
						{
							method: 'GET',
							url: fullUrl,
						},
					);

					if (response.hits && response.hits.hits) {
						for (const item of response.hits.hits) {
							returnData.push({
								name: item.title?.en || item.id,
								value: item.id,
							});
						}
					}
				} catch (error) {
					throw new NodeOperationError(this.getNode(), `Failed to load resource types from ${fullUrl}: ${error}`);
				}
				return returnData;
			},
		},
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items = this.getInputData();
		const returnData: INodeExecutionData[] = [];

		const resource = this.getNodeParameter('resource', 0);
		const operation = this.getNodeParameter('operation', 0);

		// Helper to fix common baseUrl typo: "https: //" → "https://"
		function normalizeBaseUrl(url: string | undefined): string | undefined {
			if (!url) return url;
			return url.replace(/^https:\s+\/\//i, 'https://');
		}

		// Build full URL from baseUrl + path
		function buildUrl(baseUrl: string | undefined, path: string): string {
			const normalized = normalizeBaseUrl(baseUrl);
			if (!normalized) return path;
			return `${normalized.replace(/\/+$/, '')}${path}`;
		}

		// Build full URL with query parameters
		function buildUrlWithParams(baseUrl: string | undefined, path: string, params: QueryParameters): string {
			const url = buildUrl(baseUrl, path);
			const queryString = Object.entries(params)
				.filter(([, value]) => value !== undefined && value !== null && value !== '')
				.map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`)
				.join('&');
			return queryString ? `${url}?${queryString}` : url;
		}

		for (let i = 0; i < items.length; i++) {
			try {
				let responseData: JsonObject | JsonObject[] | undefined;

				if (resource === 'ping') {
					const creds = (await this.getCredentials('inveniordmApi')) as InvenioRDMCredentials;
					const baseUrl = normalizeBaseUrl(creds.baseUrl);
					const requestPath = '/ping';
					const fullUrl = buildUrl(creds.baseUrl, requestPath);

					this.logger.info('InvenioRDM ping request', {
						baseUrl,
						requestPath,
						fullUrl,
					});

					await this.helpers.httpRequestWithAuthentication.call(
						this,
						'inveniordmApi',
						{
							method: 'GET',
							url: fullUrl,
						},
					);
					responseData = { message: 'OK' } as unknown as JsonObject;
				} else if (resource === 'record') {
					if (operation === 'get') {
						const creds = (await this.getCredentials('inveniordmApi')) as InvenioRDMCredentials;
						const baseUrl = normalizeBaseUrl(creds.baseUrl);
						const recordId = this.getNodeParameter('recordId', i) as string;
						const requestPath = `/records/${recordId}`;
						const fullUrl = buildUrl(creds.baseUrl, requestPath);

						this.logger.info('InvenioRDM record:get request', {
							baseUrl,
							accessToken: creds?.accessToken,
							requestPath,
							fullUrl,
							recordId,
						});

						responseData = await this.helpers.httpRequestWithAuthentication.call(
							this,
							'inveniordmApi',
							{
								method: 'GET',
								url: fullUrl,
							},
						);
					} else if (operation === 'getMany') {
					const returnAll = this.getNodeParameter('returnAll', i);
					const additionalFields = this.getNodeParameter('additionalFields', i) as {
						q?: string;
						sort?: string;
              page?: number;
              f?: string;
					};						const qs: QueryParameters = {};
						if (additionalFields.q) qs.q = additionalFields.q;
						if (additionalFields.sort) qs.sort = additionalFields.sort;
            if (additionalFields.page) qs.page = additionalFields.page;
            if (additionalFields.f) qs.f = additionalFields.f;

						if (!returnAll) {
							const limit = this.getNodeParameter('limit', i) as number;
							qs.size = limit;
						}

						const creds = (await this.getCredentials('inveniordmApi')) as InvenioRDMCredentials;
						const requestPath = '/records';
						const fullUrl = buildUrlWithParams(creds.baseUrl, requestPath, qs);
            this.logger.info('InvenioRDM record:get many request', {
							fullUrl,
						});

						try {
							responseData = await this.helpers.httpRequestWithAuthentication.call(
								this,
								'inveniordmApi',
								{
									method: 'GET',
									url: fullUrl,
								},
							);
						} catch (error) {
							throw new NodeApiError(this.getNode(), error as JsonObject, {
								message: `Failed to get records. URL: ${fullUrl}`,
							});
						}						if (returnAll && (responseData as JsonObject).hits) {
							responseData = ((responseData as JsonObject).hits as JsonObject).hits as JsonObject[];
						} else if ((responseData as JsonObject).hits) {
							const hits = ((responseData as JsonObject).hits as JsonObject).hits as JsonObject[];
							responseData = hits.slice(0, qs.size || 50);
						}
					} else if (operation === 'create') {
						const recordData = this.getNodeParameter('recordData', i) as string;
						let parsedData: RecordData;
						
						try {
							parsedData = JSON.parse(recordData) as RecordData;
						} catch {
							throw new NodeOperationError(this.getNode(), 'Invalid JSON in Record Data field');
						}

						const creds = (await this.getCredentials('inveniordmApi')) as InvenioRDMCredentials;
						const requestPath = '/records';
						const fullUrl = buildUrl(creds.baseUrl, requestPath);

						try {
							responseData = await this.helpers.httpRequestWithAuthentication.call(
								this,
								'inveniordmApi',
								{
									method: 'POST',
									url: fullUrl,
									body: parsedData,
								},
							);
						} catch (error) {
							throw new NodeApiError(this.getNode(), error as JsonObject, {
								message: `Failed to create record. URL: ${fullUrl}`,
							});
						}
					} else if (operation === 'update') {
						const recordId = this.getNodeParameter('recordId', i) as string;
						const recordData = this.getNodeParameter('recordData', i) as string;
						let parsedData: RecordData;
						
						try {
							parsedData = JSON.parse(recordData) as RecordData;
						} catch {
							throw new NodeOperationError(this.getNode(), 'Invalid JSON in Record Data field');
						}

						const creds = (await this.getCredentials('inveniordmApi')) as InvenioRDMCredentials;
						const requestPath = `/records/${recordId}`;
						const fullUrl = buildUrl(creds.baseUrl, requestPath);

						try {
							responseData = await this.helpers.httpRequestWithAuthentication.call(
								this,
								'inveniordmApi',
								{
									method: 'PUT',
									url: fullUrl,
									body: parsedData,
								},
							);
						} catch (error) {
							throw new NodeApiError(this.getNode(), error as JsonObject, {
								message: `Failed to update record ${recordId}. URL: ${fullUrl}`,
							});
						}
					} else if (operation === 'delete') {
						const recordId = this.getNodeParameter('recordId', i) as string;
						const creds = (await this.getCredentials('inveniordmApi')) as InvenioRDMCredentials;
						const requestPath = `/records/${recordId}`;
						const fullUrl = buildUrl(creds.baseUrl, requestPath);

						try {
							await this.helpers.httpRequestWithAuthentication.call(
								this,
								'inveniordmApi',
								{
									method: 'DELETE',
									url: fullUrl,
								},
							);
						} catch (error) {
							throw new NodeApiError(this.getNode(), error as JsonObject, {
								message: `Failed to delete record ${recordId}. URL: ${fullUrl}`,
							});
						}
						responseData = { success: true, id: recordId };
					}
				} else if (resource === 'community') {
					if (operation === 'get') {
						const communitySlug = this.getNodeParameter('communitySlug', i) as string;
						const creds = (await this.getCredentials('inveniordmApi')) as InvenioRDMCredentials;
						const requestPath = `/communities/${communitySlug}`;
						const fullUrl = buildUrl(creds.baseUrl, requestPath);

						try {
							responseData = await this.helpers.httpRequestWithAuthentication.call(
								this,
								'inveniordmApi',
								{
									method: 'GET',
									url: fullUrl,
								},
							);
						} catch (error) {
							throw new NodeApiError(this.getNode(), error as JsonObject, {
								message: `Failed to get community ${communitySlug}. URL: ${fullUrl}`,
							});
						}
					} else if (operation === 'getMany') {
						const returnAll = this.getNodeParameter('returnAll', i);
						const additionalFields = this.getNodeParameter('additionalFields', i) as {
							q?: string;
							sort?: string;
						};

						const qs: QueryParameters = {};
						if (additionalFields.q) qs.q = additionalFields.q;
						if (additionalFields.sort) qs.sort = additionalFields.sort;

						if (!returnAll) {
							const limit = this.getNodeParameter('limit', i) as number;
							qs.size = limit;
						}

						const creds = (await this.getCredentials('inveniordmApi')) as InvenioRDMCredentials;
						const requestPath = '/communities';
						const fullUrl = buildUrlWithParams(creds.baseUrl, requestPath, qs);

						try {
							responseData = await this.helpers.httpRequestWithAuthentication.call(
								this,
								'inveniordmApi',
								{
									method: 'GET',
									url: fullUrl,
								},
							);
						} catch (error) {
							throw new NodeApiError(this.getNode(), error as JsonObject, {
								message: `Failed to get communities. URL: ${fullUrl}`,
							});
						}						if (returnAll && (responseData as JsonObject).hits) {
							responseData = ((responseData as JsonObject).hits as JsonObject).hits as JsonObject[];
						} else if ((responseData as JsonObject).hits) {
							const hits = ((responseData as JsonObject).hits as JsonObject).hits as JsonObject[];
							responseData = hits.slice(0, qs.size || 50);
						}
					} else if (operation === 'getRecords') {
						const communitySlug = this.getNodeParameter('communitySlug', i) as string;
						const returnAll = this.getNodeParameter('returnAll', i);
						const additionalFields = this.getNodeParameter('additionalFields', i) as {
							q?: string;
							sort?: string;
						};

						const qs: QueryParameters = {
							l: 'list',
							p: 1,
						};
						if (additionalFields.q) qs.q = additionalFields.q;
						if (additionalFields.sort) {
							qs.sort = additionalFields.sort;
						} else {
							qs.sort = 'newest';
						}

						if (!returnAll) {
							const limit = this.getNodeParameter('limit', i) as number;
							qs.s = limit;
						} else {
							qs.s = 10;
						}

						const creds = (await this.getCredentials('inveniordmApi')) as InvenioRDMCredentials;
						const requestPath = `/communities/${communitySlug}/records`;
						const fullUrl = buildUrlWithParams(creds.baseUrl, requestPath, qs);

						try {
							responseData = await this.helpers.httpRequestWithAuthentication.call(
								this,
								'inveniordmApi',
								{
									method: 'GET',
									url: fullUrl,
								},
							);
						} catch (error) {
							throw new NodeApiError(this.getNode(), error as JsonObject, {
								message: `Failed to get records from community ${communitySlug}. URL: ${fullUrl}`,
							});
						}
						if (returnAll && (responseData as JsonObject).hits) {
							responseData = ((responseData as JsonObject).hits as JsonObject).hits as JsonObject[];
						} else if ((responseData as JsonObject).hits) {
							const hits = ((responseData as JsonObject).hits as JsonObject).hits as JsonObject[];
							responseData = hits.slice(0, qs.s || 10);
						}
					}
				}

				if (Array.isArray(responseData)) {
					returnData.push(...responseData.map((item) => ({ json: item as IDataObject })));
				} else if (responseData) {
					returnData.push({
						json: responseData as IDataObject,
					});
				}
			} catch (error) {
				if (this.continueOnFail()) {
					returnData.push({
						json: {
							error: error.message,
						},
						pairedItem: {
							item: i,
						},
					});
					continue;
				}

				if (error instanceof NodeApiError) {
					throw error;
				}

				throw new NodeApiError(this.getNode(), error as JsonObject, {
					itemIndex: i,
				});
			}
		}

		return [returnData];
	}
}
