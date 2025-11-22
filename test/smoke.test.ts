import { InvenioRDMApi } from '../credentials/InvenioRDMApi.credentials';
import { Inveniordm } from '../nodes/inveniordm/Inveniordm.node';

describe('Basic Smoke Tests', () => {
  describe('InvenioRDMApi Credentials', () => {
    it('should instantiate credentials class', () => {
      const credentials = new InvenioRDMApi();
      expect(credentials).toBeDefined();
      expect(credentials.name).toBe('inveniordmApi');
      expect(credentials.displayName).toBe('InvenioRDM API');
    });

    it('should have required properties', () => {
      const credentials = new InvenioRDMApi();
      expect(credentials.properties).toHaveLength(2);
      
      const baseUrlProp = credentials.properties.find((p: {name: string}) => p.name === 'baseUrl');
      const tokenProp = credentials.properties.find((p: {name: string}) => p.name === 'accessToken');
      
      expect(baseUrlProp).toBeDefined();
      expect(tokenProp).toBeDefined();
    });

    it('should have correct authentication configuration', () => {
      const credentials = new InvenioRDMApi();
      expect(credentials.authenticate.type).toBe('generic');
    });

    it('should have test configuration', () => {
      const credentials = new InvenioRDMApi();
      expect(credentials.test.request.url).toBe('/records');
      expect(credentials.test.request.method).toBe('GET');
    });
  });

  describe('Inveniordm Node', () => {
    it('should instantiate node class', () => {
      const node = new Inveniordm();
      expect(node).toBeDefined();
      expect(node.description.name).toBe('inveniordm');
      expect(node.description.displayName).toBe('InvenioRDM');
    });

    it('should have execute method', () => {
      const node = new Inveniordm();
      expect(typeof node.execute).toBe('function');
    });

    it('should have correct node configuration', () => {
      const node = new Inveniordm();
      const description = node.description;
      
      expect(description.version).toBe(1);
      expect(description.group).toContain('output');
      expect(description.inputs).toEqual(['main']);
      expect(description.outputs).toEqual(['main']);
    });

    it('should have credentials configuration', () => {
      const node = new Inveniordm();
      expect(node.description.credentials).toHaveLength(1);
      expect(node.description.credentials?.[0].name).toBe('inveniordmApi');
      expect(node.description.credentials?.[0].required).toBe(true);
    });

    it('should have resource and operation properties', () => {
      const node = new Inveniordm();
      const properties = node.description.properties;
      
      const resourceProp = properties.find((p: {name: string}) => p.name === 'resource');
      expect(resourceProp).toBeDefined();
      expect(resourceProp?.type).toBe('options');
      
      const operationProps = properties.filter((p: {name: string}) => p.name === 'operation');
      expect(operationProps.length).toBeGreaterThan(0);
    });

    it('should have load options methods', () => {
      const node = new Inveniordm();
      expect(node.methods?.loadOptions?.getResourceTypes).toBeDefined();
    });
  });

  describe('Integration Check', () => {
    it('should be able to create both credentials and node instances', () => {
      const credentials = new InvenioRDMApi();
      const node = new Inveniordm();
      
      // Check that the credential name matches what the node expects
      expect(credentials.name).toBe('inveniordmApi');
      expect(node.description.credentials?.[0].name).toBe('inveniordmApi');
    });
  });
});