import type {
	IAuthenticateGeneric,
	ICredentialTestRequest,
	ICredentialType,
	INodeProperties,
	Icon,
} from 'n8n-workflow';

export class InvenioRDMApi implements ICredentialType {
	name = 'inveniordmApi';

	displayName = 'InvenioRDM API';

	icon: Icon = { light: 'file:invenio-rdm.svg', dark: 'file:invenio-rdm.dark.svg' };
	
	documentationUrl =
		'https://inveniordm.docs.cern.ch/reference/rest_api_index/#authentication';

	properties: INodeProperties[] = [
		{
			displayName: 'Base URL',
			name: 'baseUrl',
			type: 'string',
			default: 'https://inveniordm.web.cern.ch',
			description: 'The base URL of your InvenioRDM instance (without trailing slash)',
			placeholder: 'https://your-instance.org',
			required: true,
		},
		{
			displayName: 'Access Token',
			name: 'accessToken',
			type: 'string',
			typeOptions: { password: true },
			default: '',
			description: 'Personal access token from your InvenioRDM instance. Go to Applications > Personal access tokens > New token.',
			placeholder: 'your-access-token-here',
			required: true,
		},
	];

	authenticate: IAuthenticateGeneric = {
		type: 'generic',
		properties: {
			headers: {
				Authorization: '=Bearer {{$credentials?.accessToken}}',
			},
		},
	};

	test: ICredentialTestRequest = {
		request: {
			baseURL: '={{$credentials?.baseUrl}}',
			url: '/api/records',
			method: 'GET',
			qs: {
				size: 1,
			},
		},
	};
}
