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
			typeOptions: {
        password: false,
        multipleValues: false,
        alwaysOpenEditWindow: true,
        rows: 1,
      },
			default: 'https://inveniordm.web.cern.ch/api',
			description: 'The base URL of your InvenioRDM instance including /api path (without trailing slash)',
			placeholder: 'https://your-instance.org/api',
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
			url: '/records',
			method: 'GET',
			qs: {
				size: 1,
			},
		},
	};
}
