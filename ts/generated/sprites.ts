// Sprite definition arrays: [w, h, x, y] or [w, h, x, y, frames]
export const spriteDefinitions: Record<string, number[]> = {
    "fox": [16,16,0,0,2],
    "goat": [16,16,0,16,2],
    "cat": [16,16,32,0,2],
    "dog": [16,16,32,16,2],
    "pig": [16,16,0,32,2],
    "boar": [16,16,32,32,2],
    "hare": [16,16,0,48,2],
    "camel": [16,16,32,48,2],
    "owl": [16,16,64,0,2],
    "hawk": [16,16,64,16,2],
    "chicken": [16,16,64,32,2],
    "desertShrub": [7,4,64,48],
    "desertShrub2": [7,4,64,52],
    "desertShrub3": [7,5,64,56],
    "desertShrub4": [7,6,71,48],
    "desertFlower": [7,8,71,54],
    "desertFlower2": [9,12,78,48],
    "animalSkeleton": [16,6,0,64],
    "desertCactus": [8,8,64,62],
    "desertCactus2": [8,8,72,62],
    "desertCactus3": [8,8,87,48],
    "desertCactusFlower": [8,8,87,56],
    "desertCactusFlower2": [8,9,0,70],
    "desertCactusFlowerWo": [8,9,8,70],
    "desert_berries": [4,4,80,60],
    "desert_berries_none": [4,4,16,70],
    "plainsFlower": [8,8,20,70],
    "plainsFlower2": [8,16,0,79],
    "plainsFlower3": [7,12,8,79],
    "plainsFlower4": [8,7,80,64],
    "plainShrub": [8,7,88,64],
    "snowy_flower": [6,5,16,64],
    "snowy_flower2": [8,12,15,79],
    "snowy_flower3": [8,10,23,78],
    "snowy_shrub": [8,8,28,70],
    "flower": [5,7,23,88],
    "plainsRuins": [8,8,31,78],
    "plainsRuins2": [8,8,36,70],
    "snowFlower": [8,8,31,86],
    "snowFlower2": [7,10,39,78],
    "snowShrub": [7,6,22,64],
    "snowSticks": [8,7,39,88],
    "log": [13,6,29,64],
    "snowman": [10,8,44,70],
    "ice_shards": [8,8,54,64],
    "snow_fir": [7,13,47,78],
    "swamp_tree7": [8,10,62,70],
    "tree_stub": [16,16,228,144],
    "tree_stub2": [6,6,42,64],
    "tree_stub3": [6,6,48,64],
    "swamp_tree6": [12,9,54,80],
    "swamp_tree": [11,11,66,80],
    "swamp_tree2": [11,11,77,71],
    "swamp_tree3": [9,8,77,82],
    "swamp_tree4": [7,6,54,89],
    "swamp_tree5": [13,16,0,95],
    "swamp_shrub": [8,5,54,72],
    "swamp_flower": [6,6,70,70],
    "swamp_flower2": [10,8,86,82],
    "swamp_flower_duo": [14,11,77,90],
    "bowman": [16,16,61,91],
    "cactus": [16,16,13,95],
    "stone_mine": [16,16,29,95],
    "building_chapel": [16,16,45,95],
    "building_library": [16,16,95,48],
    "chest_steel": [16,16,96,0],
    "chest_gold": [16,16,96,64],
    "clock_reveal": [16,16,0,111,8],
    "coconut_tree": [16,16,112,0],
    "spinning_coin": [16,16,0,127,4],
    "dead_tree": [16,16,112,16],
    "desert_ruin_large": [16,16,64,127],
    "desert_ruin_two_floor": [16,16,96,32],
    "desert_ruin_two_floor_vines": [16,16,112,32],
    "dweller": [16,16,80,127],
    "fancy_wood_bg": [32,32,128,0],
    "farm_1": [16,16,96,16],
    "farm_2": [16,16,111,48],
    "farm_3": [16,16,96,127],
    "farm_4": [16,16,112,127],
    "worker": [16,16,91,90],
    "stone_brazier": [16,16,0,143,8],
    "torches": [16,16,0,159,8],
    "lamp_post": [16,16,107,80],
    "smokehouse": [16,16,112,64],
    "building_fishing_hut_left": [16,16,127,48],
    "building_fishing_hut_right": [16,16,128,32],
    "gate_horizontal": [20,20,123,80],
    "gate_horizontal_closed": [20,20,128,100],
    "gate_horizontal_preview": [20,20,128,120],
    "gate_vertical": [20,20,128,140],
    "goblin_house": [16,16,128,64],
    "goblin": [16,16,144,32],
    "wooden_house_scaffold": [16,16,143,48],
    "wooden_house": [16,16,144,64],
    "interior_stool": [16,16,143,80],
    "interior_table": [16,16,159,48],
    "interior_stone_wall_right_bottom": [16,16,160,0],
    "interior_stone_wall_top_bottom": [16,16,160,64],
    "interior_stone_wall_right_top": [16,16,160,16],
    "interior_stone_wall_right_left": [16,16,160,32],
    "interior_stone_wall_left_top": [16,16,159,80],
    "interior_stone_wall_left_bottom": [16,16,148,96],
    "interior_wood_wall_right_bottom": [16,16,148,112],
    "interior_wood_wall_top_bottom": [16,16,148,128],
    "interior_wood_wall_right_top": [16,16,148,144],
    "interior_wood_wall_right_left": [16,16,0,175],
    "interior_wood_wall_left_top": [16,16,16,175],
    "interior_wood_wall_left_bottom": [16,16,32,175],
    "character_sword": [8,16,48,175],
    "wizard_hat": [16,16,56,175],
    "wayshrine": [16,16,175,48,8],
    "iron_brazier": [16,16,72,175,8],
    "iron_brazier_dark": [16,16,176,0],
    "glowmoss_lantern": [16,16,176,64,8],
    "pyre": [16,16,176,16,8],
    "pyre_dark": [16,16,176,32],
    "wayshrine_scaffold": [16,16,192,0],
    "iron_brazier_scaffold": [16,16,192,32],
    "glowmoss_lantern_scaffold": [16,16,208,0],
    "pyre_scaffold": [16,16,208,32],
    "mage": [16,16,224,0],
    "building_baker": [16,16,224,32],
    "building_bowyer": [16,16,240,0],
    "building_enchanter": [16,16,240,32],
    "empty_sprite": [16,16,256,0],
    "nature_grass_leaves": [9,6,96,80],
    "nature_mushroom": [8,7,88,71],
    "nature_mushroom2": [8,7,77,101],
    "nature_treestub": [14,11,107,100],
    "nature_berrybush": [13,10,128,160],
    "nature_berrybush_wo": [13,10,141,160],
    "paladin": [16,16,200,80,5],
    "pine_tree": [16,16,256,32],
    "pine_tree_winter": [16,16,272,0],
    "sword_iron": [16,16,272,32],
    "sword_emerald": [16,16,288,0],
    "sword_ruby": [16,16,288,32],
    "fish": [16,16,280,80],
    "fish_pie": [16,16,175,80],
    "building_mill": [16,16,164,96],
    "building_quarry": [16,16,164,112],
    "rocks": [16,16,164,128],
    "ruins": [16,16,164,144],
    "ruins_wines": [16,16,180,96],
    "stockpile": [16,16,180,112],
    "stone": [16,16,180,128],
    "stone2": [16,16,180,144],
    "stone3": [16,16,196,96],
    "winter_stone": [16,16,196,112],
    "winter_stone2": [16,16,196,128],
    "winter_stone3": [16,16,196,144],
    "plains_stone": [16,16,200,160],
    "plains_stone2": [16,16,212,96],
    "plains_stone3": [16,16,212,112],
    "stone_wood_walls": [16,16,212,128],
    "sun_icon": [16,16,212,144],
    "sunrise_icon": [16,16,216,160],
    "moon_icon": [16,16,228,96],
    "knight": [16,16,0,191,5],
    "knight_up": [16,16,80,191,5],
    "knight_right": [16,16,160,191,5],
    "knight_left": [16,16,0,207,5],
    "knight_idle_down": [16,16,80,207,2],
    "knight_idle_up": [16,16,112,207,2],
    "knight_idle_right": [16,16,144,207,2],
    "knight_idle_left": [16,16,176,207,2],
    "building_tavern": [16,16,208,207],
    "tent": [16,16,224,207],
    "tent_flag": [16,16,228,112],
    "building_tombstone": [16,16,228,128],
    "tree_1": [16,16,232,160],
    "tree_2": [16,16,240,176],
    "tree_3": [16,16,240,192],
    "tumbleweed_1": [16,16,256,96],
    "tumbleweed_2": [16,16,272,96],
    "warehouse": [16,16,288,96],
    "well": [16,16,244,112],
    "building_blacksmith": [16,16,244,128],
    "building_workshop": [16,16,244,144],
    "archer_skill": [32,32,260,112],
    "bag_of_glitter": [32,32,260,144],
    "Biome_Icons": [120,152,0,223],
    "blue_book": [32,32,256,176],
    "bonfire": [16,16,288,176],
    "book_border": [40,40,240,208],
    "book_grid_item": [32,32,120,223],
    "book_grid_item_focused": [32,32,152,223],
    "book_grid_item_gray": [32,32,184,223],
    "book_grid_item_gray_focused": [32,32,216,248],
    "book_left": [46,50,248,248],
    "book_right": [46,50,120,298],
    "book_tab": [40,40,120,255],
    "building_forrester": [16,16,288,192],
    "building_statue": [16,16,160,280],
    "building_tower": [16,16,216,223],
    "card": [40,48,176,255],
    "carpenter": [16,16,160,255],
    "charcoal_resource": [32,32,216,280],
    "cursor": [32,32,166,303],
    "cursor_bw": [32,32,166,335],
    "cursor_red": [32,32,248,298],
    "fancy_wood_background": [48,48,198,312],
    "fence": [16,16,280,208],
    "gem_resource": [32,32,246,330],
    "generic_skill": [32,32,304,0],
    "gold_coins": [32,32,304,32],
    "health_potion": [32,32,304,64],
    "health_potion_shadow": [32,32,304,96],
    "interior_door": [16,16,280,224],
    "interior_floor": [16,16,120,348],
    "stone_walls_cracks": [128,64,336,0],
    "iron_bars": [32,32,278,330],
    "iron_ore_resource": [32,32,280,298],
    "brown_hat": [128,128,336,64],
    "short_hair_blonde": [128,128,312,192],
    "weapons": [32,8,120,367],
    "white_beard": [128,128,0,375],
    "light": [16,16,296,208],
    "mana_potion": [32,32,304,128],
    "resource_corn": [32,32,304,160],
    "scroll": [32,32,198,360],
    "stone_resource": [32,32,152,367],
    "stone_slate_background": [48,48,128,399],
    "stone_slate_background_2x": [48,48,128,447],
    "stone_slate_border": [16,16,296,224],
    "stone_slate_border_selected": [16,16,230,360],
    "stone_slate_button_2x": [48,48,176,399],
    "stone_slate_dark_background_2x": [48,48,176,447],
    "stone_wood_walls_bottom": [20,20,440,192],
    "stone_wood_walls_br": [20,20,128,375],
    "stone_wood_walls_horizontal": [20,20,440,212],
    "stone_wood_walls_lb": [20,20,440,232],
    "stone_wood_walls_lbr": [20,20,440,252],
    "stone_wood_walls_left": [20,20,440,272],
    "stone_wood_walls_lu": [20,20,440,292],
    "stone_wood_walls_lub": [20,20,440,312],
    "stone_wood_walls_lur": [20,20,224,392],
    "stone_wood_walls_lurb": [20,20,224,412],
    "stone_wood_walls_right": [20,20,224,432],
    "stone_wood_walls_scaffold": [20,20,224,452],
    "stone_wood_walls_single": [20,20,224,472],
    "stone_wood_walls_ubr": [20,20,244,376],
    "stone_wood_walls_up": [20,20,244,396],
    "stone_wood_walls_ur": [20,20,244,416],
    "stone_wood_walls_vertical": [20,20,244,436],
    "swipe_effect": [40,40,244,456],
    "sword_skill": [32,32,264,362],
    "sword_skill_shadow": [32,32,264,394],
    "times": [16,16,294,240],
    "training_dummy": [16,16,294,256],
    "wizard_hat_skill": [32,32,284,426],
    "wood_resource": [32,32,284,458],
    "worker_skill": [32,32,296,362]
};
export const bins = [
  {
    "name": "0",
    "filename": "bin-0.png"
  }
];
export const spriteRefs = {
  "fox": {
    "bin": "0",
    "spriteId": "fox"
  },
  "goat": {
    "bin": "0",
    "spriteId": "goat"
  },
  "cat": {
    "bin": "0",
    "spriteId": "cat"
  },
  "dog": {
    "bin": "0",
    "spriteId": "dog"
  },
  "pig": {
    "bin": "0",
    "spriteId": "pig"
  },
  "boar": {
    "bin": "0",
    "spriteId": "boar"
  },
  "hare": {
    "bin": "0",
    "spriteId": "hare"
  },
  "camel": {
    "bin": "0",
    "spriteId": "camel"
  },
  "owl": {
    "bin": "0",
    "spriteId": "owl"
  },
  "hawk": {
    "bin": "0",
    "spriteId": "hawk"
  },
  "chicken": {
    "bin": "0",
    "spriteId": "chicken"
  },
  "desertShrub": {
    "bin": "0",
    "spriteId": "desertShrub"
  },
  "desertShrub2": {
    "bin": "0",
    "spriteId": "desertShrub2"
  },
  "desertShrub3": {
    "bin": "0",
    "spriteId": "desertShrub3"
  },
  "desertShrub4": {
    "bin": "0",
    "spriteId": "desertShrub4"
  },
  "desertFlower": {
    "bin": "0",
    "spriteId": "desertFlower"
  },
  "desertFlower2": {
    "bin": "0",
    "spriteId": "desertFlower2"
  },
  "animalSkeleton": {
    "bin": "0",
    "spriteId": "animalSkeleton"
  },
  "desertCactus": {
    "bin": "0",
    "spriteId": "desertCactus"
  },
  "desertCactus2": {
    "bin": "0",
    "spriteId": "desertCactus2"
  },
  "desertCactus3": {
    "bin": "0",
    "spriteId": "desertCactus3"
  },
  "desertCactusFlower": {
    "bin": "0",
    "spriteId": "desertCactusFlower"
  },
  "desertCactusFlower2": {
    "bin": "0",
    "spriteId": "desertCactusFlower2"
  },
  "desertCactusFlowerWo": {
    "bin": "0",
    "spriteId": "desertCactusFlowerWo"
  },
  "desert_berries": {
    "bin": "0",
    "spriteId": "desert_berries"
  },
  "desert_berries_none": {
    "bin": "0",
    "spriteId": "desert_berries_none"
  },
  "plainsFlower": {
    "bin": "0",
    "spriteId": "plainsFlower"
  },
  "plainsFlower2": {
    "bin": "0",
    "spriteId": "plainsFlower2"
  },
  "plainsFlower3": {
    "bin": "0",
    "spriteId": "plainsFlower3"
  },
  "plainsFlower4": {
    "bin": "0",
    "spriteId": "plainsFlower4"
  },
  "plainShrub": {
    "bin": "0",
    "spriteId": "plainShrub"
  },
  "snowy_flower": {
    "bin": "0",
    "spriteId": "snowy_flower"
  },
  "snowy_flower2": {
    "bin": "0",
    "spriteId": "snowy_flower2"
  },
  "snowy_flower3": {
    "bin": "0",
    "spriteId": "snowy_flower3"
  },
  "snowy_shrub": {
    "bin": "0",
    "spriteId": "snowy_shrub"
  },
  "flower": {
    "bin": "0",
    "spriteId": "flower"
  },
  "plainsRuins": {
    "bin": "0",
    "spriteId": "plainsRuins"
  },
  "plainsRuins2": {
    "bin": "0",
    "spriteId": "plainsRuins2"
  },
  "snowFlower": {
    "bin": "0",
    "spriteId": "snowFlower"
  },
  "snowFlower2": {
    "bin": "0",
    "spriteId": "snowFlower2"
  },
  "snowShrub": {
    "bin": "0",
    "spriteId": "snowShrub"
  },
  "snowSticks": {
    "bin": "0",
    "spriteId": "snowSticks"
  },
  "log": {
    "bin": "0",
    "spriteId": "log"
  },
  "snowman": {
    "bin": "0",
    "spriteId": "snowman"
  },
  "ice_shards": {
    "bin": "0",
    "spriteId": "ice_shards"
  },
  "snow_fir": {
    "bin": "0",
    "spriteId": "snow_fir"
  },
  "swamp_tree7": {
    "bin": "0",
    "spriteId": "swamp_tree7"
  },
  "tree_stub": {
    "bin": "0",
    "spriteId": "tree_stub"
  },
  "tree_stub2": {
    "bin": "0",
    "spriteId": "tree_stub2"
  },
  "tree_stub3": {
    "bin": "0",
    "spriteId": "tree_stub3"
  },
  "swamp_tree6": {
    "bin": "0",
    "spriteId": "swamp_tree6"
  },
  "swamp_tree": {
    "bin": "0",
    "spriteId": "swamp_tree"
  },
  "swamp_tree2": {
    "bin": "0",
    "spriteId": "swamp_tree2"
  },
  "swamp_tree3": {
    "bin": "0",
    "spriteId": "swamp_tree3"
  },
  "swamp_tree4": {
    "bin": "0",
    "spriteId": "swamp_tree4"
  },
  "swamp_tree5": {
    "bin": "0",
    "spriteId": "swamp_tree5"
  },
  "swamp_shrub": {
    "bin": "0",
    "spriteId": "swamp_shrub"
  },
  "swamp_flower": {
    "bin": "0",
    "spriteId": "swamp_flower"
  },
  "swamp_flower2": {
    "bin": "0",
    "spriteId": "swamp_flower2"
  },
  "swamp_flower_duo": {
    "bin": "0",
    "spriteId": "swamp_flower_duo"
  },
  "bowman": {
    "bin": "0",
    "spriteId": "bowman"
  },
  "cactus": {
    "bin": "0",
    "spriteId": "cactus"
  },
  "stone_mine": {
    "bin": "0",
    "spriteId": "stone_mine"
  },
  "building_chapel": {
    "bin": "0",
    "spriteId": "building_chapel"
  },
  "building_library": {
    "bin": "0",
    "spriteId": "building_library"
  },
  "chest_steel": {
    "bin": "0",
    "spriteId": "chest_steel"
  },
  "chest_gold": {
    "bin": "0",
    "spriteId": "chest_gold"
  },
  "clock_reveal": {
    "bin": "0",
    "spriteId": "clock_reveal"
  },
  "coconut_tree": {
    "bin": "0",
    "spriteId": "coconut_tree"
  },
  "spinning_coin": {
    "bin": "0",
    "spriteId": "spinning_coin"
  },
  "dead_tree": {
    "bin": "0",
    "spriteId": "dead_tree"
  },
  "desert_ruin_large": {
    "bin": "0",
    "spriteId": "desert_ruin_large"
  },
  "desert_ruin_two_floor": {
    "bin": "0",
    "spriteId": "desert_ruin_two_floor"
  },
  "desert_ruin_two_floor_vines": {
    "bin": "0",
    "spriteId": "desert_ruin_two_floor_vines"
  },
  "dweller": {
    "bin": "0",
    "spriteId": "dweller"
  },
  "fancy_wood_bg": {
    "bin": "0",
    "spriteId": "fancy_wood_bg"
  },
  "farm_1": {
    "bin": "0",
    "spriteId": "farm_1"
  },
  "farm_2": {
    "bin": "0",
    "spriteId": "farm_2"
  },
  "farm_3": {
    "bin": "0",
    "spriteId": "farm_3"
  },
  "farm_4": {
    "bin": "0",
    "spriteId": "farm_4"
  },
  "worker": {
    "bin": "0",
    "spriteId": "worker"
  },
  "stone_brazier": {
    "bin": "0",
    "spriteId": "stone_brazier"
  },
  "torches": {
    "bin": "0",
    "spriteId": "torches"
  },
  "lamp_post": {
    "bin": "0",
    "spriteId": "lamp_post"
  },
  "smokehouse": {
    "bin": "0",
    "spriteId": "smokehouse"
  },
  "building_fishing_hut_left": {
    "bin": "0",
    "spriteId": "building_fishing_hut_left"
  },
  "building_fishing_hut_right": {
    "bin": "0",
    "spriteId": "building_fishing_hut_right"
  },
  "gate_horizontal": {
    "bin": "0",
    "spriteId": "gate_horizontal"
  },
  "gate_horizontal_closed": {
    "bin": "0",
    "spriteId": "gate_horizontal_closed"
  },
  "gate_horizontal_preview": {
    "bin": "0",
    "spriteId": "gate_horizontal_preview"
  },
  "gate_vertical": {
    "bin": "0",
    "spriteId": "gate_vertical"
  },
  "goblin_house": {
    "bin": "0",
    "spriteId": "goblin_house"
  },
  "goblin": {
    "bin": "0",
    "spriteId": "goblin"
  },
  "wooden_house_scaffold": {
    "bin": "0",
    "spriteId": "wooden_house_scaffold"
  },
  "wooden_house": {
    "bin": "0",
    "spriteId": "wooden_house"
  },
  "interior_stool": {
    "bin": "0",
    "spriteId": "interior_stool"
  },
  "interior_table": {
    "bin": "0",
    "spriteId": "interior_table"
  },
  "interior_stone_wall_right_bottom": {
    "bin": "0",
    "spriteId": "interior_stone_wall_right_bottom"
  },
  "interior_stone_wall_top_bottom": {
    "bin": "0",
    "spriteId": "interior_stone_wall_top_bottom"
  },
  "interior_stone_wall_right_top": {
    "bin": "0",
    "spriteId": "interior_stone_wall_right_top"
  },
  "interior_stone_wall_right_left": {
    "bin": "0",
    "spriteId": "interior_stone_wall_right_left"
  },
  "interior_stone_wall_left_top": {
    "bin": "0",
    "spriteId": "interior_stone_wall_left_top"
  },
  "interior_stone_wall_left_bottom": {
    "bin": "0",
    "spriteId": "interior_stone_wall_left_bottom"
  },
  "interior_wood_wall_right_bottom": {
    "bin": "0",
    "spriteId": "interior_wood_wall_right_bottom"
  },
  "interior_wood_wall_top_bottom": {
    "bin": "0",
    "spriteId": "interior_wood_wall_top_bottom"
  },
  "interior_wood_wall_right_top": {
    "bin": "0",
    "spriteId": "interior_wood_wall_right_top"
  },
  "interior_wood_wall_right_left": {
    "bin": "0",
    "spriteId": "interior_wood_wall_right_left"
  },
  "interior_wood_wall_left_top": {
    "bin": "0",
    "spriteId": "interior_wood_wall_left_top"
  },
  "interior_wood_wall_left_bottom": {
    "bin": "0",
    "spriteId": "interior_wood_wall_left_bottom"
  },
  "character_sword": {
    "bin": "0",
    "spriteId": "character_sword"
  },
  "wizard_hat": {
    "bin": "0",
    "spriteId": "wizard_hat"
  },
  "wayshrine": {
    "bin": "0",
    "spriteId": "wayshrine"
  },
  "iron_brazier": {
    "bin": "0",
    "spriteId": "iron_brazier"
  },
  "iron_brazier_dark": {
    "bin": "0",
    "spriteId": "iron_brazier_dark"
  },
  "glowmoss_lantern": {
    "bin": "0",
    "spriteId": "glowmoss_lantern"
  },
  "pyre": {
    "bin": "0",
    "spriteId": "pyre"
  },
  "pyre_dark": {
    "bin": "0",
    "spriteId": "pyre_dark"
  },
  "wayshrine_scaffold": {
    "bin": "0",
    "spriteId": "wayshrine_scaffold"
  },
  "iron_brazier_scaffold": {
    "bin": "0",
    "spriteId": "iron_brazier_scaffold"
  },
  "glowmoss_lantern_scaffold": {
    "bin": "0",
    "spriteId": "glowmoss_lantern_scaffold"
  },
  "pyre_scaffold": {
    "bin": "0",
    "spriteId": "pyre_scaffold"
  },
  "mage": {
    "bin": "0",
    "spriteId": "mage"
  },
  "building_baker": {
    "bin": "0",
    "spriteId": "building_baker"
  },
  "building_bowyer": {
    "bin": "0",
    "spriteId": "building_bowyer"
  },
  "building_enchanter": {
    "bin": "0",
    "spriteId": "building_enchanter"
  },
  "empty_sprite": {
    "bin": "0",
    "spriteId": "empty_sprite"
  },
  "nature_grass_leaves": {
    "bin": "0",
    "spriteId": "nature_grass_leaves"
  },
  "nature_mushroom": {
    "bin": "0",
    "spriteId": "nature_mushroom"
  },
  "nature_mushroom2": {
    "bin": "0",
    "spriteId": "nature_mushroom2"
  },
  "nature_treestub": {
    "bin": "0",
    "spriteId": "nature_treestub"
  },
  "nature_berrybush": {
    "bin": "0",
    "spriteId": "nature_berrybush"
  },
  "nature_berrybush_wo": {
    "bin": "0",
    "spriteId": "nature_berrybush_wo"
  },
  "paladin": {
    "bin": "0",
    "spriteId": "paladin"
  },
  "pine_tree": {
    "bin": "0",
    "spriteId": "pine_tree"
  },
  "pine_tree_winter": {
    "bin": "0",
    "spriteId": "pine_tree_winter"
  },
  "sword_iron": {
    "bin": "0",
    "spriteId": "sword_iron"
  },
  "sword_emerald": {
    "bin": "0",
    "spriteId": "sword_emerald"
  },
  "sword_ruby": {
    "bin": "0",
    "spriteId": "sword_ruby"
  },
  "fish": {
    "bin": "0",
    "spriteId": "fish"
  },
  "fish_pie": {
    "bin": "0",
    "spriteId": "fish_pie"
  },
  "building_mill": {
    "bin": "0",
    "spriteId": "building_mill"
  },
  "building_quarry": {
    "bin": "0",
    "spriteId": "building_quarry"
  },
  "rocks": {
    "bin": "0",
    "spriteId": "rocks"
  },
  "ruins": {
    "bin": "0",
    "spriteId": "ruins"
  },
  "ruins_wines": {
    "bin": "0",
    "spriteId": "ruins_wines"
  },
  "stockpile": {
    "bin": "0",
    "spriteId": "stockpile"
  },
  "stone": {
    "bin": "0",
    "spriteId": "stone"
  },
  "stone2": {
    "bin": "0",
    "spriteId": "stone2"
  },
  "stone3": {
    "bin": "0",
    "spriteId": "stone3"
  },
  "winter_stone": {
    "bin": "0",
    "spriteId": "winter_stone"
  },
  "winter_stone2": {
    "bin": "0",
    "spriteId": "winter_stone2"
  },
  "winter_stone3": {
    "bin": "0",
    "spriteId": "winter_stone3"
  },
  "plains_stone": {
    "bin": "0",
    "spriteId": "plains_stone"
  },
  "plains_stone2": {
    "bin": "0",
    "spriteId": "plains_stone2"
  },
  "plains_stone3": {
    "bin": "0",
    "spriteId": "plains_stone3"
  },
  "stone_wood_walls": {
    "bin": "0",
    "spriteId": "stone_wood_walls"
  },
  "sun_icon": {
    "bin": "0",
    "spriteId": "sun_icon"
  },
  "sunrise_icon": {
    "bin": "0",
    "spriteId": "sunrise_icon"
  },
  "moon_icon": {
    "bin": "0",
    "spriteId": "moon_icon"
  },
  "knight": {
    "bin": "0",
    "spriteId": "knight"
  },
  "knight_up": {
    "bin": "0",
    "spriteId": "knight_up"
  },
  "knight_right": {
    "bin": "0",
    "spriteId": "knight_right"
  },
  "knight_left": {
    "bin": "0",
    "spriteId": "knight_left"
  },
  "knight_idle_down": {
    "bin": "0",
    "spriteId": "knight_idle_down"
  },
  "knight_idle_up": {
    "bin": "0",
    "spriteId": "knight_idle_up"
  },
  "knight_idle_right": {
    "bin": "0",
    "spriteId": "knight_idle_right"
  },
  "knight_idle_left": {
    "bin": "0",
    "spriteId": "knight_idle_left"
  },
  "building_tavern": {
    "bin": "0",
    "spriteId": "building_tavern"
  },
  "tent": {
    "bin": "0",
    "spriteId": "tent"
  },
  "tent_flag": {
    "bin": "0",
    "spriteId": "tent_flag"
  },
  "building_tombstone": {
    "bin": "0",
    "spriteId": "building_tombstone"
  },
  "tree_1": {
    "bin": "0",
    "spriteId": "tree_1"
  },
  "tree_2": {
    "bin": "0",
    "spriteId": "tree_2"
  },
  "tree_3": {
    "bin": "0",
    "spriteId": "tree_3"
  },
  "tumbleweed_1": {
    "bin": "0",
    "spriteId": "tumbleweed_1"
  },
  "tumbleweed_2": {
    "bin": "0",
    "spriteId": "tumbleweed_2"
  },
  "warehouse": {
    "bin": "0",
    "spriteId": "warehouse"
  },
  "well": {
    "bin": "0",
    "spriteId": "well"
  },
  "building_blacksmith": {
    "bin": "0",
    "spriteId": "building_blacksmith"
  },
  "building_workshop": {
    "bin": "0",
    "spriteId": "building_workshop"
  },
  "archer_skill": {
    "bin": "0",
    "spriteId": "archer_skill"
  },
  "bag_of_glitter": {
    "bin": "0",
    "spriteId": "bag_of_glitter"
  },
  "Biome_Icons": {
    "bin": "0",
    "spriteId": "Biome_Icons"
  },
  "blue_book": {
    "bin": "0",
    "spriteId": "blue_book"
  },
  "bonfire": {
    "bin": "0",
    "spriteId": "bonfire"
  },
  "book_border": {
    "bin": "0",
    "spriteId": "book_border"
  },
  "book_grid_item": {
    "bin": "0",
    "spriteId": "book_grid_item"
  },
  "book_grid_item_focused": {
    "bin": "0",
    "spriteId": "book_grid_item_focused"
  },
  "book_grid_item_gray": {
    "bin": "0",
    "spriteId": "book_grid_item_gray"
  },
  "book_grid_item_gray_focused": {
    "bin": "0",
    "spriteId": "book_grid_item_gray_focused"
  },
  "book_left": {
    "bin": "0",
    "spriteId": "book_left"
  },
  "book_right": {
    "bin": "0",
    "spriteId": "book_right"
  },
  "book_tab": {
    "bin": "0",
    "spriteId": "book_tab"
  },
  "building_forrester": {
    "bin": "0",
    "spriteId": "building_forrester"
  },
  "building_statue": {
    "bin": "0",
    "spriteId": "building_statue"
  },
  "building_tower": {
    "bin": "0",
    "spriteId": "building_tower"
  },
  "card": {
    "bin": "0",
    "spriteId": "card"
  },
  "carpenter": {
    "bin": "0",
    "spriteId": "carpenter"
  },
  "charcoal_resource": {
    "bin": "0",
    "spriteId": "charcoal_resource"
  },
  "cursor": {
    "bin": "0",
    "spriteId": "cursor"
  },
  "cursor_bw": {
    "bin": "0",
    "spriteId": "cursor_bw"
  },
  "cursor_red": {
    "bin": "0",
    "spriteId": "cursor_red"
  },
  "fancy_wood_background": {
    "bin": "0",
    "spriteId": "fancy_wood_background"
  },
  "fence": {
    "bin": "0",
    "spriteId": "fence"
  },
  "gem_resource": {
    "bin": "0",
    "spriteId": "gem_resource"
  },
  "generic_skill": {
    "bin": "0",
    "spriteId": "generic_skill"
  },
  "gold_coins": {
    "bin": "0",
    "spriteId": "gold_coins"
  },
  "health_potion": {
    "bin": "0",
    "spriteId": "health_potion"
  },
  "health_potion_shadow": {
    "bin": "0",
    "spriteId": "health_potion_shadow"
  },
  "interior_door": {
    "bin": "0",
    "spriteId": "interior_door"
  },
  "interior_floor": {
    "bin": "0",
    "spriteId": "interior_floor"
  },
  "stone_walls_cracks": {
    "bin": "0",
    "spriteId": "stone_walls_cracks"
  },
  "iron_bars": {
    "bin": "0",
    "spriteId": "iron_bars"
  },
  "iron_ore_resource": {
    "bin": "0",
    "spriteId": "iron_ore_resource"
  },
  "brown_hat": {
    "bin": "0",
    "spriteId": "brown_hat"
  },
  "short_hair_blonde": {
    "bin": "0",
    "spriteId": "short_hair_blonde"
  },
  "weapons": {
    "bin": "0",
    "spriteId": "weapons"
  },
  "white_beard": {
    "bin": "0",
    "spriteId": "white_beard"
  },
  "light": {
    "bin": "0",
    "spriteId": "light"
  },
  "mana_potion": {
    "bin": "0",
    "spriteId": "mana_potion"
  },
  "resource_corn": {
    "bin": "0",
    "spriteId": "resource_corn"
  },
  "scroll": {
    "bin": "0",
    "spriteId": "scroll"
  },
  "stone_resource": {
    "bin": "0",
    "spriteId": "stone_resource"
  },
  "stone_slate_background": {
    "bin": "0",
    "spriteId": "stone_slate_background"
  },
  "stone_slate_background_2x": {
    "bin": "0",
    "spriteId": "stone_slate_background_2x"
  },
  "stone_slate_border": {
    "bin": "0",
    "spriteId": "stone_slate_border"
  },
  "stone_slate_border_selected": {
    "bin": "0",
    "spriteId": "stone_slate_border_selected"
  },
  "stone_slate_button_2x": {
    "bin": "0",
    "spriteId": "stone_slate_button_2x"
  },
  "stone_slate_dark_background_2x": {
    "bin": "0",
    "spriteId": "stone_slate_dark_background_2x"
  },
  "stone_wood_walls_bottom": {
    "bin": "0",
    "spriteId": "stone_wood_walls_bottom"
  },
  "stone_wood_walls_br": {
    "bin": "0",
    "spriteId": "stone_wood_walls_br"
  },
  "stone_wood_walls_horizontal": {
    "bin": "0",
    "spriteId": "stone_wood_walls_horizontal"
  },
  "stone_wood_walls_lb": {
    "bin": "0",
    "spriteId": "stone_wood_walls_lb"
  },
  "stone_wood_walls_lbr": {
    "bin": "0",
    "spriteId": "stone_wood_walls_lbr"
  },
  "stone_wood_walls_left": {
    "bin": "0",
    "spriteId": "stone_wood_walls_left"
  },
  "stone_wood_walls_lu": {
    "bin": "0",
    "spriteId": "stone_wood_walls_lu"
  },
  "stone_wood_walls_lub": {
    "bin": "0",
    "spriteId": "stone_wood_walls_lub"
  },
  "stone_wood_walls_lur": {
    "bin": "0",
    "spriteId": "stone_wood_walls_lur"
  },
  "stone_wood_walls_lurb": {
    "bin": "0",
    "spriteId": "stone_wood_walls_lurb"
  },
  "stone_wood_walls_right": {
    "bin": "0",
    "spriteId": "stone_wood_walls_right"
  },
  "stone_wood_walls_scaffold": {
    "bin": "0",
    "spriteId": "stone_wood_walls_scaffold"
  },
  "stone_wood_walls_single": {
    "bin": "0",
    "spriteId": "stone_wood_walls_single"
  },
  "stone_wood_walls_ubr": {
    "bin": "0",
    "spriteId": "stone_wood_walls_ubr"
  },
  "stone_wood_walls_up": {
    "bin": "0",
    "spriteId": "stone_wood_walls_up"
  },
  "stone_wood_walls_ur": {
    "bin": "0",
    "spriteId": "stone_wood_walls_ur"
  },
  "stone_wood_walls_vertical": {
    "bin": "0",
    "spriteId": "stone_wood_walls_vertical"
  },
  "swipe_effect": {
    "bin": "0",
    "spriteId": "swipe_effect"
  },
  "sword_skill": {
    "bin": "0",
    "spriteId": "sword_skill"
  },
  "sword_skill_shadow": {
    "bin": "0",
    "spriteId": "sword_skill_shadow"
  },
  "times": {
    "bin": "0",
    "spriteId": "times"
  },
  "training_dummy": {
    "bin": "0",
    "spriteId": "training_dummy"
  },
  "wizard_hat_skill": {
    "bin": "0",
    "spriteId": "wizard_hat_skill"
  },
  "wood_resource": {
    "bin": "0",
    "spriteId": "wood_resource"
  },
  "worker_skill": {
    "bin": "0",
    "spriteId": "worker_skill"
  }
};