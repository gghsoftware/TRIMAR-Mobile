import { Asset } from 'expo-asset';
import { ImageSourcePropType } from 'react-native';

export interface HairStyle {
  id: string;
  name: string;
  image: ImageSourcePropType;
  category: string;
}

class AssetService {
  private hairstyles: HairStyle[] = [
    {
      id: 'classic-cut',
      name: 'Classic Cut',
      image: require('../assets/hairstyles/classic-cut.png'),
      category: 'men'
    },
    {
      id: 'fade-cut',
      name: 'Fade Cut',
      image: require('../assets/hairstyles/fade-cut.png'),
      category: 'men'
    },
    {
      id: 'buzz-cut',
      name: 'Buzz Cut',
      image: require('../assets/hairstyles/buzz-cut.png'),
      category: 'men'
    },
    {
      id: 'pompadour',
      name: 'Pompadour',
      image: require('../assets/hairstyles/pompadour.png'),
      category: 'men'
    },
    {
      id: 'undercut',
      name: 'Undercut',
      image: require('../assets/hairstyles/undercut.png'),
      category: 'men'
    },
    {
      id: 'long-layers',
      name: 'Long Layers',
      image: require('../assets/hairstyles/long-layers.png'),
      category: 'women'
    },
    {
      id: 'bob-cut',
      name: 'Bob Cut',
      image: require('../assets/hairstyles/bob-cut.png'),
      category: 'women'
    },
    {
      id: 'pixie-cut',
      name: 'Pixie Cut',
      image: require('../assets/hairstyles/pixie-cut.png'),
      category: 'women'
    },
    {
      id: 'curly-layers',
      name: 'Curly Layers',
      image: require('../assets/hairstyles/curly-layers.png'),
      category: 'women'
    }
  ];

  private loadedAssets: Map<string, string> = new Map();

  async loadAssets(): Promise<void> {
    try {
      // Load all hairstyle images
      const assetPromises = this.hairstyles.map(async (style) => {
        try {
          // Handle different image source types
          if (typeof style.image === 'number') {
            // Local asset (require())
            const asset = Asset.fromModule(style.image);
            await asset.downloadAsync();
            this.loadedAssets.set(style.id, asset.localUri || asset.uri);
          } else if (typeof style.image === 'object' && 'uri' in style.image) {
            // Remote URL
            this.loadedAssets.set(style.id, style.image.uri || '');
          } else {
            // Fallback to placeholder
            this.loadedAssets.set(style.id, `https://via.placeholder.com/200x200/6366f1/ffffff?text=${encodeURIComponent(style.name)}`);
          }
        } catch (error) {
          console.warn(`Failed to load asset for ${style.id}:`, error);
          // Use placeholder URL as fallback
          this.loadedAssets.set(style.id, `https://via.placeholder.com/200x200/6366f1/ffffff?text=${encodeURIComponent(style.name)}`);
        }
      });

      await Promise.all(assetPromises);
      console.log('All hairstyle assets loaded successfully');
    } catch (error) {
      console.error('Error loading assets:', error);
    }
  }

  getHairstyles(): HairStyle[] {
    return this.hairstyles;
  }

  getHairstyleById(id: string): HairStyle | undefined {
    return this.hairstyles.find(style => style.id === id);
  }

  getHairstylesByCategory(category: string): HairStyle[] {
    return this.hairstyles.filter(style => style.category === category);
  }

  getAssetUrl(id: string): string | undefined {
    return this.loadedAssets.get(id);
  }

  generateARUrl(baseUrl: string): string {
    const url = new URL(baseUrl);
    
    // Add hairstyle parameters with actual asset URLs
    this.hairstyles.forEach((style, index) => {
      const assetUrl = this.getAssetUrl(style.id);
      if (assetUrl) {
        url.searchParams.append(`hairstyle_${index}`, style.name);
        url.searchParams.append(`hairstyle_${index}_image`, assetUrl);
        url.searchParams.append(`hairstyle_${index}_category`, style.category);
      } else {
        // Fallback to placeholder if asset not loaded
        const placeholderImage = `https://via.placeholder.com/200x200/6366f1/ffffff?text=${encodeURIComponent(style.name)}`;
        url.searchParams.append(`hairstyle_${index}`, style.name);
        url.searchParams.append(`hairstyle_${index}_image`, placeholderImage);
        url.searchParams.append(`hairstyle_${index}_category`, style.category);
      }
    });

    return url.toString();
  }

  // Method to add custom hairstyles with URL
  addHairstyle(hairstyle: Omit<HairStyle, 'image'> & { imageUrl: string }): void {
    const newHairstyle: HairStyle = {
      ...hairstyle,
      image: { uri: hairstyle.imageUrl }
    };
    this.hairstyles.push(newHairstyle);
  }
}

export const assetService = new AssetService();
