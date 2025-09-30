// components/HairStyleSelector.tsx
import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Image } from 'react-native';
import { assetService, HairStyle } from '../lib/assetService';

interface HairStyleSelectorProps {
  onSelect: (hairstyle: HairStyle) => void;
  onClose: () => void;
}

export function HairStyleSelector({ onSelect, onClose }: HairStyleSelectorProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>('men');
  const hairstyles = assetService.getHairstyles();
  const categories = ['men', 'women'];

  const filteredHairstyles = hairstyles.filter(style => style.category === selectedCategory);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Choose a Hairstyle</Text>
        <TouchableOpacity onPress={onClose} style={styles.closeButton}>
          <Text style={styles.closeText}>✕</Text>
        </TouchableOpacity>
      </View>

      {/* Category Selector */}
      <View style={styles.categoryContainer}>
        {categories.map((category) => (
          <TouchableOpacity
            key={category}
            style={[
              styles.categoryButton,
              selectedCategory === category && styles.categoryButtonActive
            ]}
            onPress={() => setSelectedCategory(category)}
          >
            <Text style={[
              styles.categoryText,
              selectedCategory === category && styles.categoryTextActive
            ]}>
              {category.charAt(0).toUpperCase() + category.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Hairstyle Grid */}
      <ScrollView style={styles.hairstyleContainer}>
        <View style={styles.hairstyleGrid}>
          {filteredHairstyles.map((hairstyle) => (
            <TouchableOpacity
              key={hairstyle.id}
              style={styles.hairstyleButton}
              onPress={() => onSelect(hairstyle)}
            >
      <View style={styles.hairstyleImage}>
        <Image
          source={hairstyle.image}
          style={styles.hairstyleImageContent}
          resizeMode="cover"
          onError={(e) => {
            console.log('Image load error for', hairstyle.name, e.nativeEvent.error);
            console.log('Image source:', hairstyle.image);
          }}
          onLoad={() => console.log('Image loaded successfully for', hairstyle.name)}
        />
      </View>
              <Text style={styles.hairstyleName}>{hairstyle.name}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
  },
  closeButton: {
    padding: 8,
  },
  closeText: {
    fontSize: 18,
    color: '#6b7280',
  },
  categoryContainer: {
    flexDirection: 'row',
    padding: 16,
    gap: 8,
  },
  categoryButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#f3f4f6',
  },
  categoryButtonActive: {
    backgroundColor: '#111827',
  },
  categoryText: {
    color: '#6b7280',
    fontWeight: '600',
  },
  categoryTextActive: {
    color: '#fff',
  },
  hairstyleContainer: {
    flex: 1,
    padding: 16,
  },
  hairstyleGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  hairstyleButton: {
    width: '30%',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    backgroundColor: '#f9fafb',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  hairstyleImage: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#e5e7eb',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
    overflow: 'hidden',
  },
  hairstyleImageContent: {
    width: '100%',
    height: '100%',
  },
  hairstyleName: {
    fontSize: 12,
    fontWeight: '600',
    color: '#374151',
    textAlign: 'center',
  },
});
