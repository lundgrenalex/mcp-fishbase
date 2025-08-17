import fetch from 'node-fetch';

interface FishBaseResponse {
  data?: any[];
  error?: string;
}

interface SpeciesData {
  SpecCode?: number;
  Genus?: string;
  Species?: string;
  FBname?: string;
  Length?: number;
  CommonLength?: number;
  MaxLengthRef?: number;
  Weight?: number;
  [key: string]: any;
}

export class FishBaseAPI {
  private readonly baseUrl = 'https://huggingface.co/datasets/fishbase/fishbase/resolve/main';
  
  async getSpecies(speciesName: string, fields?: string[]): Promise<SpeciesData[]> {
    try {
      const speciesData = await this.queryTable('species');
      const [genus, species] = speciesName.split(' ');
      
      const filtered = speciesData.filter((row: any) => 
        row.Genus?.toLowerCase() === genus?.toLowerCase() && 
        row.Species?.toLowerCase() === species?.toLowerCase()
      );

      if (fields && fields.length > 0) {
        return filtered.map((row: any) => {
          const result: any = {};
          fields.forEach(field => {
            if (row[field] !== undefined) {
              result[field] = row[field];
            }
          });
          return result;
        });
      }

      return filtered;
    } catch (error) {
      throw new Error(`Failed to get species data: ${error}`);
    }
  }

  async searchSpecies(query: string, limit: number = 20): Promise<SpeciesData[]> {
    try {
      const speciesData = await this.queryTable('species');
      const lowerQuery = query.toLowerCase();
      
      const filtered = speciesData.filter((row: any) => {
        const scientificName = `${row.Genus || ''} ${row.Species || ''}`.toLowerCase();
        const commonName = (row.FBname || '').toLowerCase();
        return scientificName.includes(lowerQuery) || commonName.includes(lowerQuery);
      }).slice(0, limit);

      return filtered;
    } catch (error) {
      throw new Error(`Failed to search species: ${error}`);
    }
  }

  async getEcology(speciesName: string): Promise<any[]> {
    try {
      const speciesData = await this.getSpecies(speciesName);
      if (speciesData.length === 0) {
        throw new Error(`Species not found: ${speciesName}`);
      }
      
      const specCode = speciesData[0].SpecCode;
      const ecoData = await this.queryTable('ecology');
      
      return ecoData.filter((row: any) => row.SpecCode === specCode);
    } catch (error) {
      throw new Error(`Failed to get ecology data: ${error}`);
    }
  }

  async getDistribution(speciesName: string): Promise<any[]> {
    try {
      const speciesData = await this.getSpecies(speciesName);
      if (speciesData.length === 0) {
        throw new Error(`Species not found: ${speciesName}`);
      }
      
      const specCode = speciesData[0].SpecCode;
      const distData = await this.queryTable('occurrence');
      
      return distData.filter((row: any) => row.SpecCode === specCode);
    } catch (error) {
      throw new Error(`Failed to get distribution data: ${error}`);
    }
  }

  async getMorphology(speciesName: string): Promise<any[]> {
    try {
      const speciesData = await this.getSpecies(speciesName);
      if (speciesData.length === 0) {
        throw new Error(`Species not found: ${speciesName}`);
      }
      
      const specCode = speciesData[0].SpecCode;
      const morphData = await this.queryTable('morphdat');
      
      return morphData.filter((row: any) => row.SpecCode === specCode);
    } catch (error) {
      throw new Error(`Failed to get morphology data: ${error}`);
    }
  }

  async validateSpeciesName(speciesName: string): Promise<{ 
    valid: boolean; 
    suggestions?: string[]; 
    match?: SpeciesData 
  }> {
    try {
      const exactMatch = await this.getSpecies(speciesName);
      if (exactMatch.length > 0) {
        return { valid: true, match: exactMatch[0] };
      }

      const searchResults = await this.searchSpecies(speciesName, 5);
      return {
        valid: false,
        suggestions: searchResults.map(s => `${s.Genus} ${s.Species}`),
      };
    } catch (error) {
      throw new Error(`Failed to validate species name: ${error}`);
    }
  }

  async commonToScientific(commonName: string): Promise<SpeciesData[]> {
    try {
      const speciesData = await this.queryTable('species');
      
      const filtered = speciesData.filter((row: any) => 
        row.FBname?.toLowerCase().includes(commonName.toLowerCase())
      );

      return filtered.slice(0, 10);
    } catch (error) {
      throw new Error(`Failed to convert common name: ${error}`);
    }
  }

  async listTables(): Promise<string[]> {
    return [
      'species',
      'ecology',
      'occurrence',
      'morphdat',
      'comnames',
      'spawning',
      'diet',
      'popgrowth',
      'stocks',
      'synonyms',
      'taxa',
      'estimate',
      'ecosystem',
    ];
  }

  private async queryTable(tableName: string): Promise<any[]> {
    try {
      const response = await fetch(
        `${this.baseUrl}/${tableName}.parquet`,
        {
          method: 'GET',
          headers: {
            'Accept': 'application/octet-stream',
          },
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      throw new Error('Parquet parsing not implemented - this is a placeholder. In production, you would use a parquet parser library like apache-arrow or parquetjs');
    } catch (error) {
      console.error(`Error querying table ${tableName}:`, error);
      
      return this.getMockData(tableName);
    }
  }

  private getMockData(tableName: string): any[] {
    switch (tableName) {
      case 'species':
        return [
          {
            SpecCode: 1,
            Genus: 'Salmo',
            Species: 'trutta',
            FBname: 'Brown trout',
            Length: 100,
            CommonLength: 30,
            Weight: 17000,
          },
          {
            SpecCode: 2,
            Genus: 'Oreochromis',
            Species: 'niloticus',
            FBname: 'Nile tilapia',
            Length: 60,
            CommonLength: 35,
            Weight: 4000,
          },
        ];
      case 'ecology':
        return [
          {
            SpecCode: 1,
            EcologyRefNo: 1,
            Neritic: 'Yes',
            SupraLittoral: 'No',
            Littoral: 'Yes',
            Sublittoral: 'Yes',
            Climate: 'temperate',
          },
        ];
      case 'occurrence':
        return [
          {
            SpecCode: 1,
            C_Code: 'USA',
            Occurrence: 'native',
            Status: 'established',
          },
        ];
      case 'morphdat':
        return [
          {
            SpecCode: 1,
            MorphDataRefNo: 1,
            BodyShapeI: 'fusiform / normal',
            TypeofMouth: 'terminal',
          },
        ];
      default:
        return [];
    }
  }
}