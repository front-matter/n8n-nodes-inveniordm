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
	q?: string;
	sort?: string;
	size?: number;
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
	};
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
			baseURL: '={{$credentials?.baseUrl}}/api',
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
						operation: ['getMany'],
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
						operation: ['getMany'],
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
						operation: ['getMany'],
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
								name: 'Most Downloaded',
								value: 'mostdownloaded',
							},
							{
								name: 'Most Recent',
								value: 'mostrecent',
							},
							{
								name: 'Most Viewed',
								value: 'mostviewed',
							},
							{
								name: 'Oldest',
								value: 'oldest',
							},
						],
						default: 'bestmatch',
						description: 'Sort order for results',
					},
				],
			},

			// Community operations
			{
				displayName: 'Community ID',
				name: 'communityId',
				type: 'string',
				required: true,
				displayOptions: {
					show: {
						resource: ['community'],
						operation: ['get'],
					},
				},
				default: '',
				description: 'The ID of the community',
			},

			// Create/Update record fields
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
				const requestUrl = '/vocabularies/resourcetypes';
				try {
					const response = await this.helpers.httpRequestWithAuthentication.call(
						this,
						'inveniordmApi',
						{
							method: 'GET',
							url: requestUrl,
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
					throw new NodeOperationError(this.getNode(), `Failed to load resource types from ${requestUrl}: ${error}`);
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

		for (let i = 0; i < items.length; i++) {
			try {
				let responseData: JsonObject | JsonObject[] | undefined;

				if (resource === 'record') {
					if (operation === 'get') {
						const recordId = this.getNodeParameter('recordId', i) as string;
						responseData = await this.helpers.httpRequestWithAuthentication.call(
							this,
							'inveniordmApi',
							{
								method: 'GET',
								url: `/records/${recordId}`,
							},
						);
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

					const requestUrl = '/records';
					try {
						responseData = await this.helpers.httpRequestWithAuthentication.call(
							this,
							'inveniordmApi',
							{
								method: 'GET',
								url: requestUrl,
								qs,
							},
						);
					} catch (error) {
						throw new NodeApiError(this.getNode(), error as JsonObject, {
							message: `Failed to get records. URL: ${requestUrl}`,
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

						const requestUrl = '/records';
						try {
							responseData = await this.helpers.httpRequestWithAuthentication.call(
								this,
								'inveniordmApi',
								{
									method: 'POST',
									url: requestUrl,
									body: parsedData,
								},
							);
						} catch (error) {
							throw new NodeApiError(this.getNode(), error as JsonObject, {
								message: `Failed to create record. URL: ${requestUrl}`,
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

						const requestUrl = `/records/${recordId}`;
						try {
							responseData = await this.helpers.httpRequestWithAuthentication.call(
								this,
								'inveniordmApi',
								{
									method: 'PUT',
									url: requestUrl,
									body: parsedData,
								},
							);
						} catch (error) {
							throw new NodeApiError(this.getNode(), error as JsonObject, {
								message: `Failed to update record ${recordId}. URL: ${requestUrl}`,
							});
						}
					} else if (operation === 'delete') {
						const recordId = this.getNodeParameter('recordId', i) as string;
						const requestUrl = `/records/${recordId}`;
						try {
							await this.helpers.httpRequestWithAuthentication.call(
								this,
								'inveniordmApi',
								{
									method: 'DELETE',
									url: requestUrl,
								},
							);
						} catch (error) {
							throw new NodeApiError(this.getNode(), error as JsonObject, {
								message: `Failed to delete record ${recordId}. URL: ${requestUrl}`,
							});
						}
						responseData = { success: true, id: recordId };
					}
				} else if (resource === 'community') {
					if (operation === 'get') {
				const communityId = this.getNodeParameter('communityId', i) as string;
					const requestUrl = `/communities/${communityId}`;
						try {
							responseData = await this.helpers.httpRequestWithAuthentication.call(
								this,
								'inveniordmApi',
								{
									method: 'GET',
									url: requestUrl,
								},
							);
						} catch (error) {
							throw new NodeApiError(this.getNode(), error as JsonObject, {
								message: `Failed to get community ${communityId}. URL: ${requestUrl}`,
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

						const requestUrl = '/communities';
						try {
							responseData = await this.helpers.httpRequestWithAuthentication.call(
								this,
								'inveniordmApi',
								{
									method: 'GET',
									url: requestUrl,
									qs,
								},
							);
					} catch (error) {
						throw new NodeApiError(this.getNode(), error as JsonObject, {
							message: `Failed to get communities. URL: ${requestUrl}`,
						});
					}						if (returnAll && (responseData as JsonObject).hits) {
							responseData = ((responseData as JsonObject).hits as JsonObject).hits as JsonObject[];
						} else if ((responseData as JsonObject).hits) {
							const hits = ((responseData as JsonObject).hits as JsonObject).hits as JsonObject[];
							responseData = hits.slice(0, qs.size || 50);
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
