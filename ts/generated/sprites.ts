// Sprite definition arrays: [w, h, x, y] or [w, h, x, y, frames]
export const spriteDefinitions: Record<string, number[]> = {
    "fox": [16,16,0,0,2],
    "goat": [16,16,0,16,2],
    "desertShrub": [7,4,32,0],
    "desertShrub2": [7,4,32,4],
    "desertShrub3": [7,5,32,8],
    "desertShrub4": [7,6,32,13],
    "desertFlower": [7,8,32,19],
    "desertFlower2": [9,12,0,32],
    "animalSkeleton": [16,6,9,32],
    "desertCactus": [8,8,25,32],
    "desertCactus2": [8,8,39,0],
    "desertCactus3": [8,8,39,8],
    "desertCactusFlower": [8,8,39,16],
    "desertCactusFlower2": [8,9,39,24],
    "desertCactusFlowerWo": [8,9,33,33],
    "desert_berries": [4,4,9,40],
    "desert_berries_none": [4,4,13,40],
    "plainsFlower": [8,8,17,38],
    "plainsFlower2": [8,16,47,0],
    "plainsFlower3": [7,12,25,40],
    "plainsFlower4": [8,7,47,16],
    "plainShrub": [8,7,47,23],
    "snowy_flower": [6,5,32,27],
    "snowy_flower2": [8,12,47,30],
    "snowy_flower3": [8,10,32,42],
    "snowy_shrub": [8,8,0,44],
    "flower": [5,7,41,33],
    "plainsRuins": [8,8,8,44],
    "plainsRuins2": [8,8,40,42],
    "snowFlower": [8,8,0,52],
    "snowFlower2": [7,10,40,50],
    "snowShrub": [7,6,48,42],
    "snowSticks": [8,7,47,50],
    "log": [13,6,8,52],
    "snowman": [10,8,21,52],
    "ice_shards": [8,8,31,52],
    "snow_fir": [7,13,55,0],
    "swamp_tree7": [8,10,0,60],
    "tree_stub": [16,16,224,80],
    "tree_stub2": [6,6,16,46],
    "tree_stub3": [6,6,55,17],
    "swamp_tree6": [12,9,8,58],
    "swamp_tree": [11,11,47,57],
    "swamp_tree2": [11,11,62,0],
    "swamp_tree3": [9,8,20,60],
    "swamp_tree4": [7,6,62,11],
    "swamp_tree5": [13,16,58,23],
    "swamp_shrub": [8,5,61,17],
    "swamp_flower": [6,6,29,60],
    "swamp_flower2": [10,8,35,60],
    "swamp_flower_duo": [14,11,58,39],
    "bowman": [16,16,0,70],
    "cactus": [16,16,16,68],
    "stone_mine": [16,16,32,68],
    "building_chapel": [16,16,48,68],
    "building_library": [16,16,73,0],
    "chest_steel": [16,16,72,16],
    "chest_gold": [16,16,72,32],
    "clock_reveal": [16,16,0,86,8],
    "coconut_tree": [16,16,58,50],
    "dead_tree": [16,16,64,66],
    "desert_ruin_large": [16,16,74,48],
    "desert_ruin_two_floor": [16,16,80,64],
    "desert_ruin_two_floor_vines": [16,16,88,16],
    "dweller": [16,16,88,32],
    "fancy_wood_bg": [32,32,96,48],
    "farm_1": [16,16,89,0],
    "farm_2": [16,16,105,0],
    "farm_3": [16,16,104,16],
    "farm_4": [16,16,104,32],
    "worker": [16,16,0,102],
    "stone_brazier": [16,16,0,118,8],
    "gate_horizontal": [20,20,128,0],
    "gate_horizontal_closed": [20,20,128,20],
    "gate_horizontal_preview": [20,20,128,40],
    "gate_vertical": [20,20,128,60],
    "goblin_house": [16,16,16,102],
    "goblin": [16,16,32,102],
    "wooden_house_scaffold": [16,16,48,102],
    "wooden_house": [16,16,64,102],
    "interior_stool": [16,16,80,102],
    "interior_table": [16,16,96,102],
    "interior_stone_wall_right_bottom": [16,16,112,102],
    "interior_stone_wall_top_bottom": [16,16,128,80],
    "interior_stone_wall_right_top": [16,16,128,96],
    "interior_stone_wall_right_left": [16,16,128,112],
    "interior_stone_wall_left_top": [16,16,0,134],
    "interior_stone_wall_left_bottom": [16,16,16,134],
    "interior_wood_wall_right_bottom": [16,16,32,134],
    "interior_wood_wall_top_bottom": [16,16,48,134],
    "interior_wood_wall_right_top": [16,16,64,134],
    "interior_wood_wall_right_left": [16,16,80,134],
    "interior_wood_wall_left_top": [16,16,96,134],
    "interior_wood_wall_left_bottom": [16,16,112,134],
    "character_sword": [8,16,120,16],
    "wizard_hat": [16,16,128,128],
    "mage": [16,16,148,0],
    "building_baker": [16,16,148,16],
    "building_bowyer": [16,16,148,32],
    "building_enchanter": [16,16,148,48],
    "empty_sprite": [16,16,148,64],
    "nature_grass_leaves": [9,6,80,80],
    "nature_mushroom": [8,7,120,32],
    "nature_mushroom2": [8,7,120,39],
    "nature_treestub": [14,11,144,80],
    "nature_berrybush": [13,10,144,91],
    "nature_berrybush_wo": [13,10,144,101],
    "paladin": [16,16,0,150,5],
    "pine_tree": [16,16,80,150],
    "pine_tree_winter": [16,16,96,150],
    "sword_iron": [16,16,112,150],
    "sword_emerald": [16,16,144,111],
    "sword_ruby": [16,16,144,127],
    "building_mill": [16,16,144,143],
    "building_quarry": [16,16,128,144],
    "rocks": [16,16,164,0],
    "ruins": [16,16,164,16],
    "ruins_wines": [16,16,164,32],
    "stockpile": [16,16,164,48],
    "stone": [16,16,164,64],
    "stone2": [16,16,160,80],
    "stone3": [16,16,160,96],
    "winter_stone": [16,16,160,112],
    "winter_stone2": [16,16,160,128],
    "winter_stone3": [16,16,160,144],
    "plains_stone": [16,16,144,159],
    "plains_stone2": [16,16,128,160],
    "plains_stone3": [16,16,0,166],
    "stone_wood_walls": [16,16,16,166],
    "sun_icon": [16,16,32,166],
    "sunrise_icon": [16,16,48,166],
    "moon_icon": [16,16,64,166],
    "knight": [16,16,180,0,5],
    "knight_up": [16,16,180,16,5],
    "knight_right": [16,16,180,32,5],
    "knight_left": [16,16,180,48,5],
    "knight_idle_down": [16,16,80,166,2],
    "knight_idle_up": [16,16,160,160,2],
    "knight_idle_right": [16,16,192,64,2],
    "knight_idle_left": [16,16,224,64,2],
    "building_tavern": [16,16,112,166],
    "tent": [16,16,192,80],
    "tent_flag": [16,16,176,80],
    "building_tombstone": [16,16,208,80],
    "tree_1": [16,16,240,80],
    "tree_2": [16,16,176,96],
    "tree_3": [16,16,176,112],
    "tumbleweed_1": [16,16,176,128],
    "tumbleweed_2": [16,16,176,144],
    "warehouse": [16,16,192,96],
    "well": [16,16,208,96],
    "building_blacksmith": [16,16,224,96],
    "building_workshop": [16,16,240,96],
    "archer_skill": [32,32,192,112],
    "bag_of_glitter": [32,32,224,112],
    "Biome_Icons": [120,152,0,182],
    "blue_book": [32,32,192,144],
    "bonfire": [16,16,144,175],
    "book_border": [40,40,160,176],
    "book_grid_item": [32,32,224,144],
    "book_grid_item_focused": [32,32,120,191],
    "book_grid_item_gray": [32,32,200,176],
    "book_grid_item_gray_focused": [32,32,200,208],
    "book_left": [46,50,152,216],
    "book_right": [46,50,198,240],
    "book_tab": [40,40,120,290],
    "building_forrester": [16,16,244,176],
    "building_statue": [16,16,244,192],
    "building_tower": [16,16,244,208],
    "card": [40,48,260,0],
    "carpenter": [16,16,232,224],
    "coins": [64,16,120,266],
    "cursor": [32,32,120,223],
    "cursor_bw": [32,32,160,282],
    "cursor_red": [32,32,260,48],
    "fancy_wood_background": [48,48,248,224],
    "fence": [16,16,160,314],
    "gem_resource": [32,32,260,80],
    "generic_skill": [32,32,260,112],
    "gold_coins": [32,32,256,144],
    "health_potion": [32,32,260,176],
    "health_potion_shadow": [32,32,192,290],
    "interior_door": [16,16,260,208],
    "interior_floor": [16,16,176,314],
    "stone_walls_cracks": [128,64,300,0],
    "brown_hat": [128,128,296,64],
    "short_hair_blonde": [128,128,296,192],
    "weapons": [32,8,120,255],
    "white_beard": [128,128,0,334],
    "light": [16,16,276,208],
    "mana_potion": [32,32,244,272],
    "resource_corn": [32,32,224,304],
    "scroll": [32,32,192,322],
    "stone_resource": [32,32,256,304],
    "stone_slate_background": [48,48,128,330],
    "stone_slate_background_2x": [48,48,128,378],
    "stone_slate_border": [16,16,176,330],
    "stone_slate_border_selected": [16,16,176,346],
    "stone_slate_button_2x": [48,48,176,362],
    "stone_slate_dark_background_2x": [48,48,176,410],
    "stone_wood_walls_bottom": [20,20,276,272],
    "stone_wood_walls_br": [20,20,128,426],
    "stone_wood_walls_horizontal": [20,20,148,426],
    "stone_wood_walls_lb": [20,20,224,336],
    "stone_wood_walls_lbr": [20,20,224,356],
    "stone_wood_walls_left": [20,20,224,376],
    "stone_wood_walls_lu": [20,20,224,396],
    "stone_wood_walls_lub": [20,20,224,416],
    "stone_wood_walls_lur": [20,20,224,436],
    "stone_wood_walls_lurb": [20,20,244,336],
    "stone_wood_walls_right": [20,20,244,356],
    "stone_wood_walls_scaffold": [20,20,244,376],
    "stone_wood_walls_single": [20,20,244,396],
    "stone_wood_walls_ubr": [20,20,244,416],
    "stone_wood_walls_up": [20,20,244,436],
    "stone_wood_walls_ur": [20,20,264,336],
    "stone_wood_walls_vertical": [20,20,264,356],
    "swipe_effect": [40,40,264,376],
    "sword_skill": [32,32,284,336],
    "sword_skill_shadow": [32,32,264,416],
    "times": [16,16,128,446],
    "training_dummy": [16,16,288,320],
    "wizard_hat_skill": [32,32,296,416],
    "wood_resource": [32,32,304,368],
    "worker_skill": [32,32,316,320]
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
  "coins": {
    "bin": "0",
    "spriteId": "coins"
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