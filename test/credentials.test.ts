import { InvenioRDMApi } from '../credentials/InvenioRDMApi.credentials';

describe('InvenioRDMApi Credentials', () => {
  let credentials: InvenioRDMApi;

  beforeEach(() => {
    credentials = new InvenioRDMApi();
  });

  describe('Basic Properties', () => {
    it('should have correct name', () => {
      expect(credentials.name).toBe('inveniordmApi');
    });

    it('should have correct display name', () => {
      expect(credentials.displayName).toBe('InvenioRDM API');
    });

    it('should have documentation URL', () => {
      expect(credentials.documentationUrl).toBe(
        'https://inveniordm.docs.cern.ch/reference/rest_api_index/#authentication'
      );
    });

    it('should have icon defined', () => {
      expect(credentials.icon).toBeDefined();
      expect(typeof credentials.icon).toBe('object');
    });
  });

  describe('Properties Configuration', () => {
    it('should have correct number of properties', () => {
      expect(credentials.properties).toHaveLength(2);
    });

    it('should have Base URL property', () => {
      const baseUrlProperty = credentials.properties.find((p: {name: string}) => p.name === 'baseUrl');
      expect(baseUrlProperty).toBeDefined();
      if (baseUrlProperty) {
        expect(baseUrlProperty.displayName).toBe('Base URL');
        expect(baseUrlProperty.type).toBe('string');
        expect(baseUrlProperty.required).toBe(true);
      }
    });

    it('should have Access Token property', () => {
      const tokenProperty = credentials.properties.find((p: {name: string}) => p.name === 'accessToken');
      expect(tokenProperty).toBeDefined();
      if (tokenProperty) {
        expect(tokenProperty.displayName).toBe('Access Token');
        expect(tokenProperty.type).toBe('string');
        expect(tokenProperty.required).toBe(true);
      }
    });
  });

  describe('Authentication Configuration', () => {
    it('should have correct authentication type', () => {
      expect(credentials.authenticate.type).toBe('generic');
    });

    it('should use Bearer token authentication', () => {
      expect(credentials.authenticate.properties?.headers?.Authorization).toBe(
        '=Bearer {{$credentials?.accessToken}}'
      );
    });
  });

  describe('Test Configuration', () => {
    it('should have correct test request configuration', () => {
      expect(credentials.test.request.baseURL).toBe('={{$credentials?.baseUrl}}');
      expect(credentials.test.request.url).toBe('/api/records');
      expect(credentials.test.request.method).toBe('GET');
    });
  });
});