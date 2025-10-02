import { describe, it, expect, vi } from 'vitest';

// Mock the modules with inline factories
vi.mock('../data/items.json', () => ({
  default: {
    '1001': { name: 'Test Relic 1', color: 'red' },
    '1002': { name: 'Test Relic 2', color: 'blue' },
    '1003': { name: 'Test Relic 3', color: 'yellow' },
    '1004': { name: 'Test Relic 4', color: 'green' },
    '1005': { name: 'Forbidden Relic', color: 'red' },
    '1006': { name: 'Test Relic 6', color: 'blue' },
    '1007': { name: 'Test Relic 7', color: 'yellow' },
    '1008': { name: 'Test Relic 8', color: 'green' }
  }
}));

vi.mock('../data/chaliceData.js', () => ({
  chaliceData: {
    testCharacter: [
      {
        name: 'Test Chalice 1',
        baseSlots: ['red', 'blue'],
        deepSlots: [],
        description: 'Test chalice with 2 slots'
      },
      {
        name: 'Test Chalice 2', 
        baseSlots: ['red', 'blue', 'yellow'],
        deepSlots: [],
        description: 'Test chalice with 3 slots'
      }
    ]
  }
}));

import { calculateBestRelics } from './calculation.js';

// Mock data for testing
const mockEffectMap = new Map([
  [7000700, 'Arcane +1'],
  [7000701, 'Arcane +2'], 
  [7000400, 'Dexterity +1'],
  [7610500, 'Increased Maximum FP'],
  [7610400, 'Increased Maximum HP'],
  [7000100, 'Strength +1'],
  [7000200, 'Intelligence +1'],
]);

const mockCharacterRelicData = {
  relics: [
    {
      item_id: 1001,
      effect1_id: 7000700, // Arcane +1 (stacks)
      effect2_id: 7000400, // Dexterity +1 (stacks)
      effect3_id: null,
      sec_effect1_id: null,
      sec_effect2_id: null,
      sec_effect3_id: null,
      sorting: 1001
    },
    {
      item_id: 1002,
      effect1_id: 7610500, // Increased Maximum FP (non-stacking)
      effect2_id: 7000100, // Strength +1 (stacks)
      effect3_id: null,
      sec_effect1_id: null,
      sec_effect2_id: null,
      sec_effect3_id: null,
      sorting: 1002
    },
    {
      item_id: 1003,
      effect1_id: 7610500, // Increased Maximum FP (non-stacking) - duplicate
      effect2_id: 7000200, // Intelligence +1 (stacks)
      effect3_id: null,
      sec_effect1_id: null,
      sec_effect2_id: null,
      sec_effect3_id: null,
      sorting: 1003
    },
    {
      item_id: 1004,
      effect1_id: 7610400, // Increased Maximum HP (non-stacking)
      effect2_id: 7000701, // Arcane +2 (stacks)
      effect3_id: null,
      sec_effect1_id: null,
      sec_effect2_id: null,
      sec_effect3_id: null,
      sorting: 1004
    },
    {
      item_id: 1005,
      effect1_id: 7000100, // Strength +1 (stacks) - forbidden test relic
      effect2_id: 7000400, // Dexterity +1 (stacks)
      effect3_id: null,
      sec_effect1_id: null,
      sec_effect2_id: null,
      sec_effect3_id: null,
      sorting: 1005
    },
    // Add more relics to ensure we have enough for each color
    {
      item_id: 1006,
      effect1_id: 7000700, // Arcane +1 (stacks)
      effect2_id: null,
      effect3_id: null,
      sec_effect1_id: null,
      sec_effect2_id: null,
      sec_effect3_id: null,
      sorting: 1006
    },
    {
      item_id: 1007,
      effect1_id: 7000400, // Dexterity +1 (stacks)
      effect2_id: null,
      effect3_id: null,
      sec_effect1_id: null,
      sec_effect2_id: null,
      sec_effect3_id: null,
      sorting: 1007
    },
    {
      item_id: 1008,
      effect1_id: 7000200, // Intelligence +1 (stacks)
      effect2_id: null,
      effect3_id: null,
      sec_effect1_id: null,
      sec_effect2_id: null,
      sec_effect3_id: null,
      sorting: 1008
    }
  ]
};

describe('Weight Parameter Tests', () => {
  describe('Positive Weights', () => {
    it('should correctly calculate scores with positive weights', () => {
      const desiredEffects = [
        {
          name: 'Arcane Boost',
          ids: [7000700, 7000701], // Arcane +1, +2 (both stack)
          weight: 5,
          isForbidden: false,
          isRequired: false
        },
        {
          name: 'Dexterity Boost',
          ids: [7000400], // Dexterity +1 (stacks)
          weight: 3,
          isForbidden: false,
          isRequired: false
        }
      ];

      const result = calculateBestRelics(
        desiredEffects,
        mockCharacterRelicData,
        ['Test Chalice 1'],
        'testCharacter',
        mockEffectMap,
        false
      );

      expect(result).toBeTruthy();
      expect(result.length).toBeGreaterThan(0);
      expect(result[0].score).toBeGreaterThan(0);
    });

    it('should handle high positive weights correctly', () => {
      const desiredEffects = [
        {
          name: 'High Weight Effect',
          ids: [7000700],
          weight: 100,
          isForbidden: false,
          isRequired: false
        }
      ];

      const result = calculateBestRelics(
        desiredEffects,
        mockCharacterRelicData,
        ['Test Chalice 1'],
        'testCharacter',
        mockEffectMap,
        false
      );

      expect(result).toBeTruthy();
      expect(result[0].score).toBe(100); // Should get exactly the weight value
    });

    it('should correctly sum multiple positive weights', () => {
      const desiredEffects = [
        {
          name: 'Effect 1',
          ids: [7000700], // Arcane +1
          weight: 10,
          isForbidden: false,
          isRequired: false
        },
        {
          name: 'Effect 2', 
          ids: [7000400], // Dexterity +1
          weight: 15,
          isForbidden: false,
          isRequired: false
        }
      ];

      const result = calculateBestRelics(
        desiredEffects,
        mockCharacterRelicData,
        ['Test Chalice 1'],
        'testCharacter',
        mockEffectMap,
        false
      );

      expect(result).toBeTruthy();
      // Should find the best combination: relic 1001 (Arcane+Dex=25) + relic 1006 (Arcane=10) = 35
      // This is correct because Arcane effects stack, so we get 10+10+15 = 35
      expect(result[0].score).toBe(35);
    });
  });

  describe('Negative Weights', () => {
    it('should correctly handle negative weights', () => {
      const desiredEffects = [
        {
          name: 'Unwanted Effect',
          ids: [7000700], // Arcane +1
          weight: -10,
          isForbidden: false,
          isRequired: false
        },
        {
          name: 'Wanted Effect',
          ids: [7000400], // Dexterity +1  
          weight: 20,
          isForbidden: false,
          isRequired: false
        }
      ];

      const result = calculateBestRelics(
        desiredEffects,
        mockCharacterRelicData,
        ['Test Chalice 1'],
        'testCharacter',
        mockEffectMap,
        false
      );

      expect(result).toBeTruthy();
      // Relic 1001 has both effects: -10 + 20 = 10
      // Other relics should be preferred if they only have the positive effect
    });

    it('should filter out relics with negative total scores', () => {
      const desiredEffects = [
        {
          name: 'Heavily Unwanted Effect',
          ids: [7000700], // Arcane +1
          weight: -50,
          isForbidden: false,
          isRequired: false
        }
      ];

      const result = calculateBestRelics(
        desiredEffects,
        mockCharacterRelicData,
        ['Test Chalice 1'],
        'testCharacter',
        mockEffectMap,
        false
      );

      // Should return null or empty since all relics with this effect get negative scores
      expect(result).toBeNull();
    });

    it('should handle mixed positive and negative weights correctly', () => {
      const desiredEffects = [
        {
          name: 'Good Effect',
          ids: [7000100], // Strength +1
          weight: 15,
          isForbidden: false,
          isRequired: false
        },
        {
          name: 'Bad Effect',
          ids: [7610500], // Increased Maximum FP
          weight: -5,
          isForbidden: false,
          isRequired: false
        }
      ];

      const result = calculateBestRelics(
        desiredEffects,
        mockCharacterRelicData,
        ['Test Chalice 1'],
        'testCharacter',
        mockEffectMap,
        false
      );

      expect(result).toBeTruthy();
      // Relic 1002 has both: 15 - 5 = 10
      // Should still be viable but with reduced score
    });
  });

  describe('Zero and Edge Case Weights', () => {
    it('should handle zero weights', () => {
      const desiredEffects = [
        {
          name: 'Zero Weight Effect',
          ids: [7000700],
          weight: 0,
          isForbidden: false,
          isRequired: false
        }
      ];

      const result = calculateBestRelics(
        desiredEffects,
        mockCharacterRelicData,
        ['Test Chalice 1'],
        'testCharacter',
        mockEffectMap,
        false
      );

      // Should return null since no relics have positive scores
      expect(result).toBeNull();
    });

    it('should handle undefined/null weights (should default to 1)', () => {
      const desiredEffects = [
        {
          name: 'Default Weight Effect',
          ids: [7000700],
          weight: undefined,
          isForbidden: false,
          isRequired: false
        }
      ];

      const result = calculateBestRelics(
        desiredEffects,
        mockCharacterRelicData,
        ['Test Chalice 1'],
        'testCharacter',
        mockEffectMap,
        false
      );

      expect(result).toBeTruthy();
      expect(result[0].score).toBe(1); // Should default to weight 1
    });

    it('should handle very large weights', () => {
      const desiredEffects = [
        {
          name: 'Massive Weight Effect',
          ids: [7000700],
          weight: 999999,
          isForbidden: false,
          isRequired: false
        }
      ];

      const result = calculateBestRelics(
        desiredEffects,
        mockCharacterRelicData,
        ['Test Chalice 1'],
        'testCharacter',
        mockEffectMap,
        false
      );

      expect(result).toBeTruthy();
      expect(result[0].score).toBe(999999);
    });
  });

  describe('Stacking vs Non-Stacking with Weights', () => {
    it('should correctly handle stacking effects with weights', () => {
      const desiredEffects = [
        {
          name: 'Stacking Arcane',
          ids: [7000700, 7000701], // Both stack
          weight: 10,
          isForbidden: false,
          isRequired: false
        }
      ];

      const result = calculateBestRelics(
        desiredEffects,
        mockCharacterRelicData,
        ['Test Chalice 2'], // 3 slots to allow multiple arcane relics
        'testCharacter',
        mockEffectMap,
        false
      );

      expect(result).toBeTruthy();
      // Should be able to get multiple stacking effects
      // If we get both Arcane +1 and Arcane +2, score should be 10 + 10 = 20
    });

    it('should correctly handle non-stacking effects with weights', () => {
      const desiredEffects = [
        {
          name: 'Non-Stacking FP',
          ids: [7610500], // Non-stacking
          weight: 10,
          isForbidden: false,
          isRequired: false
        }
      ];

      const result = calculateBestRelics(
        desiredEffects,
        mockCharacterRelicData,
        ['Test Chalice 2'], // 3 slots
        'testCharacter',
        mockEffectMap,
        false
      );

      expect(result).toBeTruthy();
      // Even if multiple relics have this effect, should only count weight once
      // Score should be 10, not 20 (even though relics 1002 and 1003 both have it)
      expect(result[0].score).toBe(10);
    });
  });
});

describe('isForbidden Parameter Tests', () => {
  describe('Basic Forbidden Functionality', () => {
    it('should exclude relics with forbidden effects', () => {
      const desiredEffects = [
        {
          name: 'Wanted Effect',
          ids: [7000400], // Dexterity +1
          weight: 10,
          isForbidden: false,
          isRequired: false
        },
        {
          name: 'Forbidden Effect',
          ids: [7000100], // Strength +1
          weight: 5,
          isForbidden: true,
          isRequired: false
        }
      ];

      const result = calculateBestRelics(
        desiredEffects,
        mockCharacterRelicData,
        ['Test Chalice 1'],
        'testCharacter',
        mockEffectMap,
        false
      );

      expect(result).toBeTruthy();
      
      // Check that no selected relics have the forbidden effect
      const selectedRelics = result[0].baseRelics;
      for (const relic of selectedRelics) {
        expect(relic['relic id']).not.toBe(1002); // Relic 1002 has Strength +1
        expect(relic['relic id']).not.toBe(1005); // Relic 1005 has Strength +1
      }
    });

    it('should handle multiple forbidden effects', () => {
      const desiredEffects = [
        {
          name: 'Forbidden Effect 1',
          ids: [7000100], // Strength +1
          weight: 10,
          isForbidden: true,
          isRequired: false
        },
        {
          name: 'Forbidden Effect 2',
          ids: [7610500], // Increased Maximum FP
          weight: 10,
          isForbidden: true,
          isRequired: false
        },
        {
          name: 'Allowed Effect',
          ids: [7000700], // Arcane +1
          weight: 10,
          isForbidden: false,
          isRequired: false
        }
      ];

      const result = calculateBestRelics(
        desiredEffects,
        mockCharacterRelicData,
        ['Test Chalice 1'],
        'testCharacter',
        mockEffectMap,
        false
      );

      expect(result).toBeTruthy();
      
      // Should only select relics without forbidden effects
      const selectedRelics = result[0].baseRelics;
      for (const relic of selectedRelics) {
        // Should not select relics 1002, 1003, 1005 (they have forbidden effects)
        expect([1002, 1003, 1005]).not.toContain(relic['relic id']);
      }
    });

    it('should return null when all viable relics are forbidden', () => {
      const desiredEffects = [
        {
          name: 'Forbidden Everything',
          ids: [7000700, 7000400, 7000100, 7610500, 7610400, 7000200, 7000701], // All effects
          weight: 10,
          isForbidden: true,
          isRequired: false
        }
      ];

      const result = calculateBestRelics(
        desiredEffects,
        mockCharacterRelicData,
        ['Test Chalice 1'],
        'testCharacter',
        mockEffectMap,
        false
      );

      // Should return null since all relics are forbidden
      expect(result).toBeNull();
    });
  });

  describe('Forbidden with Weight Interactions', () => {
    it('should ignore weight when effect is forbidden', () => {
      const desiredEffects = [
        {
          name: 'High Weight Forbidden',
          ids: [7000100], // Strength +1
          weight: 1000, // Very high weight
          isForbidden: true,
          isRequired: false
        },
        {
          name: 'Low Weight Allowed',
          ids: [7000700], // Arcane +1
          weight: 1,
          isForbidden: false,
          isRequired: false
        }
      ];

      const result = calculateBestRelics(
        desiredEffects,
        mockCharacterRelicData,
        ['Test Chalice 1'],
        'testCharacter',
        mockEffectMap,
        false
      );

      expect(result).toBeTruthy();
      
      // Should select low weight allowed effect over high weight forbidden
      const selectedRelics = result[0].baseRelics;
      const hasStrength = selectedRelics.some(relic => 
        relic['relic id'] === 1002 || relic['relic id'] === 1005
      );
      expect(hasStrength).toBe(false);
    });

    it('should handle forbidden effects with negative weights', () => {
      const desiredEffects = [
        {
          name: 'Negative Forbidden',
          ids: [7000100], // Strength +1
          weight: -10,
          isForbidden: true,
          isRequired: false
        },
        {
          name: 'Positive Allowed',
          ids: [7000700], // Arcane +1
          weight: 5,
          isForbidden: false,
          isRequired: false
        }
      ];

      const result = calculateBestRelics(
        desiredEffects,
        mockCharacterRelicData,
        ['Test Chalice 1'],
        'testCharacter',
        mockEffectMap,
        false
      );

      expect(result).toBeTruthy();
      // Should still exclude forbidden effects regardless of negative weight
    });
  });

  describe('Forbidden Edge Cases', () => {
    it('should handle forbidden effects that don\'t exist in any relics', () => {
      const desiredEffects = [
        {
          name: 'Non-existent Forbidden',
          ids: [9999999], // Effect that doesn't exist
          weight: 10,
          isForbidden: true,
          isRequired: false
        },
        {
          name: 'Real Effect',
          ids: [7000700], // Arcane +1
          weight: 10,
          isForbidden: false,
          isRequired: false
        }
      ];

      const result = calculateBestRelics(
        desiredEffects,
        mockCharacterRelicData,
        ['Test Chalice 1'],
        'testCharacter',
        mockEffectMap,
        false
      );

      expect(result).toBeTruthy();
      // Should work normally since the forbidden effect doesn't exist
    });

    it('should handle empty forbidden effect IDs array', () => {
      const desiredEffects = [
        {
          name: 'Empty Forbidden',
          ids: [], // Empty array
          weight: 10,
          isForbidden: true,
          isRequired: false
        },
        {
          name: 'Real Effect',
          ids: [7000700],
          weight: 10,
          isForbidden: false,
          isRequired: false
        }
      ];

      const result = calculateBestRelics(
        desiredEffects,
        mockCharacterRelicData,
        ['Test Chalice 1'],
        'testCharacter',
        mockEffectMap,
        false
      );

      expect(result).toBeTruthy();
      // Should work normally since empty forbidden array affects nothing
    });

    it('should handle forbidden flag with undefined/null values', () => {
      const desiredEffects = [
        {
          name: 'Undefined Forbidden',
          ids: [7000100],
          weight: 10,
          isForbidden: undefined,
          isRequired: false
        },
        {
          name: 'Null Forbidden',
          ids: [7000200],
          weight: 10,
          isForbidden: null,
          isRequired: false
        },
        {
          name: 'Real Effect',
          ids: [7000700],
          weight: 10,
          isForbidden: false,
          isRequired: false
        }
      ];

      const result = calculateBestRelics(
        desiredEffects,
        mockCharacterRelicData,
        ['Test Chalice 1'],
        'testCharacter',
        mockEffectMap,
        false
      );

      expect(result).toBeTruthy();
      // Should treat undefined/null as false (not forbidden)
    });
  });

  describe('Performance with Forbidden Effects', () => {
    it('should efficiently filter forbidden relics early', () => {
      const desiredEffects = [
        {
          name: 'Common Forbidden Effect',
          ids: [7000100], // Strength +1 (in multiple relics)
          weight: 10,
          isForbidden: true,
          isRequired: false
        },
        {
          name: 'Allowed Effect',
          ids: [7000700],
          weight: 10,
          isForbidden: false,
          isRequired: false
        }
      ];

      const startTime = performance.now();
      const result = calculateBestRelics(
        desiredEffects,
        mockCharacterRelicData,
        ['Test Chalice 2'], // Larger chalice
        'testCharacter',
        mockEffectMap,
        false
      );
      const endTime = performance.now();

      expect(result).toBeTruthy();
      // Should complete quickly since forbidden relics are filtered early
      expect(endTime - startTime).toBeLessThan(100); // Should be very fast with mock data
    });
  });
});

describe('Integration Tests - Weight and Forbidden Together', () => {
  it('should correctly combine weight and forbidden logic', () => {
    const desiredEffects = [
      {
        name: 'High Weight Allowed',
        ids: [7000700], // Arcane +1
        weight: 20,
        isForbidden: false,
        isRequired: false
      },
      {
        name: 'Medium Weight Forbidden',
        ids: [7000100], // Strength +1
        weight: 15,
        isForbidden: true,
        isRequired: false
      },
      {
        name: 'Low Weight Allowed',
        ids: [7000400], // Dexterity +1
        weight: 5,
        isForbidden: false,
        isRequired: false
      }
    ];

    const result = calculateBestRelics(
      desiredEffects,
      mockCharacterRelicData,
      ['Test Chalice 1'],
      'testCharacter',
      mockEffectMap,
      false
    );

    expect(result).toBeTruthy();
    expect(result[0].score).toBe(25); // 20 + 5, forbidden effect ignored
  });

  it('should handle complex scenarios with stacking, weights, and forbidden', () => {
    const desiredEffects = [
      {
        name: 'Stacking Allowed High Weight',
        ids: [7000700, 7000701], // Arcane effects (stack)
        weight: 10,
        isForbidden: false,
        isRequired: false
      },
      {
        name: 'Non-Stacking Forbidden',
        ids: [7610500], // Increased Maximum FP (non-stacking)
        weight: 15,
        isForbidden: true,
        isRequired: false
      },
      {
        name: 'Regular Effect',
        ids: [7000400], // Dexterity +1
        weight: 5,
        isForbidden: false,
        isRequired: false
      }
    ];

    const result = calculateBestRelics(
      desiredEffects,
      mockCharacterRelicData,
      ['Test Chalice 2'],
      'testCharacter',
      mockEffectMap,
      false
    );

    expect(result).toBeTruthy();
    // Should exclude relics with forbidden non-stacking effect
    // Should properly handle stacking effects with weights
  });
});

describe('isRequired Parameter Tests', () => {
  describe('Basic Required Functionality', () => {
    it('should ensure required effects are present in selected combination', () => {
      const desiredEffects = [
        {
          name: 'Required Effect',
          ids: [7000100], // Strength +1
          weight: 10,
          isForbidden: false,
          isRequired: true
        },
        {
          name: 'Optional Effect',
          ids: [7000700], // Arcane +1
          weight: 20,
          isForbidden: false,
          isRequired: false
        }
      ];

      const result = calculateBestRelics(
        desiredEffects,
        mockCharacterRelicData,
        ['Test Chalice 1'],
        'testCharacter',
        mockEffectMap,
        false
      );

      expect(result).toBeTruthy();
      
      // Check that the selected combination contains the required effect
      const selectedRelics = result[0].baseRelics;
      const hasRequiredEffect = selectedRelics.some(relic => 
        relic['effect 1'] === 'Strength +1' || relic['effect 2'] === 'Strength +1'
      );
      expect(hasRequiredEffect).toBe(true);
    });

    it('should fallback to lower-scoring combination if highest score lacks required effects', () => {
      const desiredEffects = [
        {
          name: 'High Weight Optional',
          ids: [7000700], // Arcane +1 (only in relics 1001, 1004, 1006)
          weight: 50,
          isForbidden: false,
          isRequired: false
        },
        {
          name: 'Low Weight Required',
          ids: [7000100], // Strength +1 (only in relics 1002, 1005)
          weight: 5,
          isForbidden: false,
          isRequired: true
        }
      ];

      const result = calculateBestRelics(
        desiredEffects,
        mockCharacterRelicData,
        ['Test Chalice 1'],
        'testCharacter',
        mockEffectMap,
        false
      );

      expect(result).toBeTruthy();
      
      // Should select a combination with required Strength +1, even if score is lower
      const selectedRelics = result[0].baseRelics;
      const hasRequiredEffect = selectedRelics.some(relic => 
        relic['effect 1'] === 'Strength +1' || relic['effect 2'] === 'Strength +1'
      );
      expect(hasRequiredEffect).toBe(true);
    });

    it('should handle multiple required effects', () => {
      const desiredEffects = [
        {
          name: 'Required Effect 1',
          ids: [7000100], // Strength +1
          weight: 10,
          isForbidden: false,
          isRequired: true
        },
        {
          name: 'Required Effect 2',
          ids: [7000400], // Dexterity +1
          weight: 10,
          isForbidden: false,
          isRequired: true
        },
        {
          name: 'Optional High Weight',
          ids: [7000700], // Arcane +1
          weight: 100,
          isForbidden: false,
          isRequired: false
        }
      ];

      const result = calculateBestRelics(
        desiredEffects,
        mockCharacterRelicData,
        ['Test Chalice 1'],
        'testCharacter',
        mockEffectMap,
        false
      );

      expect(result).toBeTruthy();
      
      // Check that both required effects are present
      const selectedRelics = result[0].baseRelics;
      const hasStrength = selectedRelics.some(relic => 
        relic['effect 1'] === 'Strength +1' || relic['effect 2'] === 'Strength +1'
      );
      const hasDexterity = selectedRelics.some(relic => 
        relic['effect 1'] === 'Dexterity +1' || relic['effect 2'] === 'Dexterity +1'
      );
      
      expect(hasStrength).toBe(true);
      expect(hasDexterity).toBe(true);
    });

    it('should return null when required effects cannot be satisfied', () => {
      const desiredEffects = [
        {
          name: 'Impossible Required Effect',
          ids: [9999999], // Effect that doesn't exist in any relic
          weight: 10,
          isForbidden: false,
          isRequired: true
        },
        {
          name: 'Optional Effect',
          ids: [7000700], // Arcane +1
          weight: 20,
          isForbidden: false,
          isRequired: false
        }
      ];

      const result = calculateBestRelics(
        desiredEffects,
        mockCharacterRelicData,
        ['Test Chalice 1'],
        'testCharacter',
        mockEffectMap,
        false
      );

      // Should return null since required effect cannot be satisfied
      expect(result).toBeNull();
    });
  });

  describe('Required with Forbidden Interactions', () => {
    it('should handle required effects that are also forbidden (should return null)', () => {
      const desiredEffects = [
        {
          name: 'Required and Forbidden',
          ids: [7000100], // Strength +1
          weight: 10,
          isForbidden: true,
          isRequired: true
        }
      ];

      const result = calculateBestRelics(
        desiredEffects,
        mockCharacterRelicData,
        ['Test Chalice 1'],
        'testCharacter',
        mockEffectMap,
        false
      );

      // Should return null since effect is both required and forbidden
      expect(result).toBeNull();
    });

    it('should satisfy required effects while avoiding forbidden ones', () => {
      const desiredEffects = [
        {
          name: 'Required Effect',
          ids: [7000400], // Dexterity +1
          weight: 10,
          isForbidden: false,
          isRequired: true
        },
        {
          name: 'Forbidden Effect',
          ids: [7000100], // Strength +1
          weight: 15,
          isForbidden: true,
          isRequired: false
        },
        {
          name: 'Optional Effect',
          ids: [7000700], // Arcane +1
          weight: 5,
          isForbidden: false,
          isRequired: false
        }
      ];

      const result = calculateBestRelics(
        desiredEffects,
        mockCharacterRelicData,
        ['Test Chalice 1'],
        'testCharacter',
        mockEffectMap,
        false
      );

      expect(result).toBeTruthy();
      
      // Should have required Dexterity but not forbidden Strength
      const selectedRelics = result[0].baseRelics;
      const hasDexterity = selectedRelics.some(relic => 
        relic['effect 1'] === 'Dexterity +1' || relic['effect 2'] === 'Dexterity +1'
      );
      const hasStrength = selectedRelics.some(relic => 
        relic['effect 1'] === 'Strength +1' || relic['effect 2'] === 'Strength +1'
      );
      
      expect(hasDexterity).toBe(true);
      expect(hasStrength).toBe(false);
    });
  });

  describe('Required with Weight Interactions', () => {
    it('should prioritize satisfying requirements over maximizing score', () => {
      const desiredEffects = [
        {
          name: 'Very High Weight Optional',
          ids: [7000700], // Arcane +1
          weight: 1000,
          isForbidden: false,
          isRequired: false
        },
        {
          name: 'Low Weight Required',
          ids: [7610500], // Increased Maximum FP (non-stacking)
          weight: 1,
          isForbidden: false,
          isRequired: true
        }
      ];

      const result = calculateBestRelics(
        desiredEffects,
        mockCharacterRelicData,
        ['Test Chalice 1'],
        'testCharacter',
        mockEffectMap,
        false
      );

      expect(result).toBeTruthy();
      
      // Should include required effect even though it has low weight
      const selectedRelics = result[0].baseRelics;
      const hasRequiredEffect = selectedRelics.some(relic => 
        relic['effect 1'] === 'Increased Maximum FP' || relic['effect 2'] === 'Increased Maximum FP'
      );
      expect(hasRequiredEffect).toBe(true);
    });

    it('should handle required effects with negative weights', () => {
      const desiredEffects = [
        {
          name: 'Required Negative Weight',
          ids: [7000100], // Strength +1
          weight: -10,
          isForbidden: false,
          isRequired: true
        },
        {
          name: 'Optional Positive Weight',
          ids: [7000700], // Arcane +1
          weight: 5,
          isForbidden: false,
          isRequired: false
        }
      ];

      const result = calculateBestRelics(
        desiredEffects,
        mockCharacterRelicData,
        ['Test Chalice 1'],
        'testCharacter',
        mockEffectMap,
        false
      );

      expect(result).toBeTruthy();
      
      // Should still include required effect despite negative weight
      const selectedRelics = result[0].baseRelics;
      const hasRequiredEffect = selectedRelics.some(relic => 
        relic['effect 1'] === 'Strength +1' || relic['effect 2'] === 'Strength +1'
      );
      expect(hasRequiredEffect).toBe(true);
      
      // Score might be negative, but that's okay
      expect(typeof result[0].score).toBe('number');
    });
  });

  describe('Required with Stacking Effects', () => {
    it('should satisfy required stacking effects', () => {
      const desiredEffects = [
        {
          name: 'Required Stacking Effect',
          ids: [7000700, 7000701], // Arcane +1 and +2 (both stack)
          weight: 10,
          isForbidden: false,
          isRequired: true
        }
      ];

      const result = calculateBestRelics(
        desiredEffects,
        mockCharacterRelicData,
        ['Test Chalice 1'],
        'testCharacter',
        mockEffectMap,
        false
      );

      expect(result).toBeTruthy();
      
      // Should have at least one Arcane effect (either +1 or +2)
      const selectedRelics = result[0].baseRelics;
      const hasArcaneEffect = selectedRelics.some(relic => 
        relic['effect 1'] === 'Arcane +1' || relic['effect 1'] === 'Arcane +2' ||
        relic['effect 2'] === 'Arcane +1' || relic['effect 2'] === 'Arcane +2'
      );
      expect(hasArcaneEffect).toBe(true);
    });

    it('should satisfy required non-stacking effects', () => {
      const desiredEffects = [
        {
          name: 'Required Non-Stacking Effect',
          ids: [7610500], // Increased Maximum FP (non-stacking)
          weight: 10,
          isForbidden: false,
          isRequired: true
        },
        {
          name: 'Optional Effect',
          ids: [7000700], // Arcane +1
          weight: 20,
          isForbidden: false,
          isRequired: false
        }
      ];

      const result = calculateBestRelics(
        desiredEffects,
        mockCharacterRelicData,
        ['Test Chalice 1'],
        'testCharacter',
        mockEffectMap,
        false
      );

      expect(result).toBeTruthy();
      
      // Should have the required non-stacking effect
      const selectedRelics = result[0].baseRelics;
      const hasRequiredEffect = selectedRelics.some(relic => 
        relic['effect 1'] === 'Increased Maximum FP' || relic['effect 2'] === 'Increased Maximum FP'
      );
      expect(hasRequiredEffect).toBe(true);
    });
  });

  describe('Required Edge Cases', () => {
    it('should handle empty required effect IDs array', () => {
      const desiredEffects = [
        {
          name: 'Empty Required',
          ids: [], // Empty array
          weight: 10,
          isForbidden: false,
          isRequired: true
        },
        {
          name: 'Real Effect',
          ids: [7000700],
          weight: 10,
          isForbidden: false,
          isRequired: false
        }
      ];

      const result = calculateBestRelics(
        desiredEffects,
        mockCharacterRelicData,
        ['Test Chalice 1'],
        'testCharacter',
        mockEffectMap,
        false
      );

      expect(result).toBeTruthy();
      // Should work normally since empty required array is automatically satisfied
    });

    it('should handle required flag with undefined/null values', () => {
      const desiredEffects = [
        {
          name: 'Undefined Required',
          ids: [7000700],
          weight: 10,
          isForbidden: false,
          isRequired: undefined
        },
        {
          name: 'Null Required',
          ids: [7000400],
          weight: 10,
          isForbidden: false,
          isRequired: null
        }
      ];

      const result = calculateBestRelics(
        desiredEffects,
        mockCharacterRelicData,
        ['Test Chalice 1'],
        'testCharacter',
        mockEffectMap,
        false
      );

      expect(result).toBeTruthy();
      // Should treat undefined/null as false (not required)
    });
  });

  describe('Performance with Required Effects', () => {
    it('should efficiently find valid combinations with required effects', () => {
      const desiredEffects = [
        {
          name: 'Required Effect',
          ids: [7000100], // Strength +1
          weight: 10,
          isForbidden: false,
          isRequired: true
        },
        {
          name: 'Optional Effect',
          ids: [7000700], // Arcane +1
          weight: 15,
          isForbidden: false,
          isRequired: false
        }
      ];

      const startTime = performance.now();
      const result = calculateBestRelics(
        desiredEffects,
        mockCharacterRelicData,
        ['Test Chalice 2'], // Larger chalice
        'testCharacter',
        mockEffectMap,
        false
      );
      const endTime = performance.now();

      expect(result).toBeTruthy();
      // Should complete quickly even with required validation
      expect(endTime - startTime).toBeLessThan(100); // Should be very fast with mock data
      
      // Verify required effect is present
      const selectedRelics = result[0].baseRelics;
      const hasRequiredEffect = selectedRelics.some(relic => 
        relic['effect 1'] === 'Strength +1' || relic['effect 2'] === 'Strength +1'
      );
      expect(hasRequiredEffect).toBe(true);
    });
  });
});

describe('Integration Tests - Weight, Forbidden, and Required Together', () => {
  it('should correctly handle all three parameters together', () => {
    const desiredEffects = [
      {
        name: 'High Weight Required',
        ids: [7000400], // Dexterity +1
        weight: 20,
        isForbidden: false,
        isRequired: true
      },
      {
        name: 'Medium Weight Forbidden',
        ids: [7000100], // Strength +1
        weight: 15,
        isForbidden: true,
        isRequired: false
      },
      {
        name: 'Low Weight Optional',
        ids: [7000700], // Arcane +1
        weight: 5,
        isForbidden: false,
        isRequired: false
      }
    ];

    const result = calculateBestRelics(
      desiredEffects,
      mockCharacterRelicData,
      ['Test Chalice 1'],
      'testCharacter',
      mockEffectMap,
      false
    );

    expect(result).toBeTruthy();
    
    const selectedRelics = result[0].baseRelics;
    
    // Should have required Dexterity
    const hasDexterity = selectedRelics.some(relic => 
      relic['effect 1'] === 'Dexterity +1' || relic['effect 2'] === 'Dexterity +1'
    );
    expect(hasDexterity).toBe(true);
    
    // Should not have forbidden Strength
    const hasStrength = selectedRelics.some(relic => 
      relic['effect 1'] === 'Strength +1' || relic['effect 2'] === 'Strength +1'
    );
    expect(hasStrength).toBe(false);
  });

  it('should handle complex scenario with stacking, weights, forbidden, and required', () => {
    const desiredEffects = [
      {
        name: 'Required Stacking Effect',
        ids: [7000700, 7000701], // Arcane effects (stack)
        weight: 10,
        isForbidden: false,
        isRequired: true
      },
      {
        name: 'Forbidden Non-Stacking',
        ids: [7610500], // Increased Maximum FP (non-stacking)
        weight: 20,
        isForbidden: true,
        isRequired: false
      },
      {
        name: 'Optional Effect',
        ids: [7000400], // Dexterity +1
        weight: 5,
        isForbidden: false,
        isRequired: false
      }
    ];

    const result = calculateBestRelics(
      desiredEffects,
      mockCharacterRelicData,
      ['Test Chalice 2'],
      'testCharacter',
      mockEffectMap,
      false
    );

    expect(result).toBeTruthy();
    
    const selectedRelics = result[0].baseRelics;
    
    // Should have required Arcane effect
    const hasArcane = selectedRelics.some(relic => 
      relic['effect 1'] === 'Arcane +1' || relic['effect 1'] === 'Arcane +2' ||
      relic['effect 2'] === 'Arcane +1' || relic['effect 2'] === 'Arcane +2'
    );
    expect(hasArcane).toBe(true);
    
    // Should not have forbidden FP effect
    const hasFP = selectedRelics.some(relic => 
      relic['effect 1'] === 'Increased Maximum FP' || relic['effect 2'] === 'Increased Maximum FP'
    );
    expect(hasFP).toBe(false);
  });
});