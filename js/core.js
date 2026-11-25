"use strict";
/* ============ DATA ============ */
const FOODS = []; /* 2026.11.01-b: the baked-in personal food library was removed — a fresh app ships no foods; the generic VERIFIED_FOODS database below is the only built-in list. */
/* Fuel Verified Foods v1 — Fuel's own built-in database: no barcode scan, no third-party lookup.
   Servings are standard label servings or the item weight.
   n=name s=serving cal/p/c/f b=brand nutrs=[Fiber g, Sodium mg] */
const VERIFIED_FOODS = [{n:"McDonald's, Big Mac", s:"1 item 7.6 oz (219 g)", cal:563, p:25.8, c:44.0, f:32.9, nutrs:[{n:"Fiber",amt:3.5,u:"g"},{n:"Sodium",amt:1007.4,u:"mg"}]},
  {n:"McDonald's, Big Mac (Without Big Mac Sauce)", s:"1 item (200 g)", cal:468, p:25.6, c:42.0, f:23.2, nutrs:[{n:"Fiber",amt:3.4,u:"g"},{n:"Sodium",amt:908.0,u:"mg"}]},
  {n:"McDonald's, Big Breakfast", s:"1 item 9.5 oz (269 g)", cal:767, p:27.4, c:47.1, f:52.2, nutrs:[{n:"Fiber",amt:3.0,u:"g"},{n:"Sodium",amt:1476.8,u:"mg"}]},
  {n:"McDonald's, Cheeseburger", s:"1 item 4 oz (119 g)", cal:313, p:15.5, c:33.1, f:14.0, nutrs:[{n:"Fiber",amt:1.3,u:"g"},{n:"Sodium",amt:744.9,u:"mg"}]},
  {n:"Burger King, Whopper, No Cheese", s:"1 item (291 g)", cal:678, p:31.1, c:54.1, f:37.2, nutrs:[{n:"Fiber",amt:5.2,u:"g"},{n:"Sodium",amt:910.8,u:"mg"}]},
  {n:"Burger King, Whopper, With Cheese", s:"1 item (316 g)", cal:790, p:35.4, c:52.8, f:48.3, nutrs:[{n:"Fiber",amt:3.2,u:"g"},{n:"Sodium",amt:1431.5,u:"mg"}]},
  {n:"Burger King, Double Whopper, No Cheese", s:"1 item (374 g)", cal:942, p:52.0, c:51.2, f:58.7, nutrs:[{n:"Fiber",amt:5.2,u:"g"},{n:"Sodium",amt:1080.9,u:"mg"}]},
  {n:"Chick-fil-A, Chicken Sandwich", s:"1 sandwich (187 g)", cal:466, p:30.5, c:39.1, f:20.9, nutrs:[{n:"Fiber",amt:2.6,u:"g"},{n:"Sodium",amt:1408.1,u:"mg"}]},
  {n:"Chick-fil-A, Chick-N-Strips", s:"1 serving 4 pieces (201 g)", cal:458, p:43.0, c:20.9, f:22.5, nutrs:[{n:"Fiber",amt:1.8,u:"g"},{n:"Sodium",amt:1159.8,u:"mg"}]},
  {n:"Chick-fil-A, Hash Browns", s:"1 serving (77 g)", cal:232, p:2.3, c:23.5, f:14.2, nutrs:[{n:"Fiber",amt:2.5,u:"g"},{n:"Sodium",amt:349.6,u:"mg"}]},
  {n:"Wendy's, Crispy Chicken Sandwich", s:"1 sandwich (126 g)", cal:350, p:14.7, c:33.3, f:17.5, nutrs:[{n:"Sodium",amt:713.2,u:"mg"}]},
  {n:"Taco Bell, Taco Salad", s:"1 item (533 g)", cal:906, p:35.7, c:80.5, f:48.9, nutrs:[{n:"Fiber",amt:16.0,u:"g"},{n:"Sodium",amt:1934.8,u:"mg"}]},
  {n:"Taco Bell, Nachos", s:"1 serving (80 g)", cal:280, p:3.5, c:27.9, f:17.2, nutrs:[{n:"Fiber",amt:2.6,u:"g"},{n:"Sodium",amt:250.4,u:"mg"}]},
  {n:"Taco Bell, Soft Taco With Steak", s:"1 item (127 g)", cal:286, p:15.0, c:21.8, f:15.4, nutrs:[{n:"Fiber",amt:2.0,u:"g"},{n:"Sodium",amt:699.8,u:"mg"}]},
  {n:"Taco Bell, Bean Burrito", s:"1 each burrito (185 g)", cal:387, p:13.6, c:57.7, f:11.2, nutrs:[{n:"Fiber",amt:7.8,u:"g"},{n:"Sodium",amt:1041.5,u:"mg"}]},
  {n:"Taco Bell, Nachos Supreme", s:"1 serving (222 g)", cal:495, p:13.8, c:47.5, f:27.8, nutrs:[{n:"Fiber",amt:8.2,u:"g"},{n:"Sodium",amt:772.6,u:"mg"}]},
  {n:"Taco Bell, Original Taco With Beef, Cheese And Lettuce", s:"1 each taco (69 g)", cal:158, p:6.1, c:13.7, f:8.8, nutrs:[{n:"Fiber",amt:2.7,u:"g"},{n:"Sodium",amt:273.9,u:"mg"}]},
  {n:"Taco Bell, Soft Taco With Beef, Cheese And Lettuce", s:"1 each taco (102 g)", cal:210, p:9.4, c:20.6, f:9.9, nutrs:[{n:"Fiber",amt:3.0,u:"g"},{n:"Sodium",amt:571.2,u:"mg"}]},
  {n:"Taco Bell, Soft Taco With Chicken, Cheese And Lettuce", s:"1 each taco (98 g)", cal:185, p:13.0, c:19.3, f:6.2, nutrs:[{n:"Fiber",amt:1.2,u:"g"},{n:"Sodium",amt:600.7,u:"mg"}]},
  {n:"Taco Bell, Burrito Supreme With Beef", s:"1 burrito (241 g)", cal:441, p:16.9, c:56.4, f:16.4, nutrs:[{n:"Fiber",amt:8.9,u:"g"},{n:"Sodium",amt:1086.9,u:"mg"}]},
  {n:"Taco Bell, Burrito Supreme With Chicken", s:"1 item (248 g)", cal:444, p:24.4, c:50.8, f:15.9, nutrs:[{n:"Fiber",amt:6.0,u:"g"},{n:"Sodium",amt:1398.7,u:"mg"}]},
  {n:"Taco Bell, Burrito Supreme With Steak", s:"1 item (248 g)", cal:454, p:22.6, c:50.3, f:18.0, nutrs:[{n:"Fiber",amt:6.0,u:"g"},{n:"Sodium",amt:1324.3,u:"mg"}]},
  {n:"Taco Shells, Baked", s:"1 shell (12.9 g)", cal:61, p:0.8, c:8.2, f:2.8, nutrs:[{n:"Fiber",amt:0.9,u:"g"},{n:"Sodium",amt:41.8,u:"mg"}]},
  {n:"Seasoning Mix, Dry, Taco, Original", s:"1 tsp (5.7 g)", cal:18, p:0.3, c:3.3, f:0.0, nutrs:[{n:"Fiber",amt:0.8,u:"g"},{n:"Sodium",amt:410.4,u:"mg"}]},
  {n:"Snacks, Tortilla Chips, Taco-Flavor", s:"1 bag (8 oz) (227 g)", cal:1090, p:17.9, c:143.2, f:54.9, nutrs:[{n:"Fiber",amt:12.0,u:"g"},{n:"Sodium",amt:1786.5,u:"mg"}]},
  {n:"Taco Shells, Baked, Without Added Salt", s:"1 oz (28.35 g)", cal:133, p:2.0, c:17.7, f:6.4, nutrs:[{n:"Fiber",amt:2.1,u:"g"},{n:"Sodium",amt:4.3,u:"mg"}]},
  {n:"Fast Foods, Taco With Beef, Cheese And Lettuce, Soft", s:"1 each taco (102 g)", cal:210, p:9.4, c:20.6, f:9.9, nutrs:[{n:"Fiber",amt:3.0,u:"g"},{n:"Sodium",amt:571.2,u:"mg"}]},
  {n:"Fast Foods, Taco With Chicken, Lettuce And Cheese, Soft", s:"1 each taco (98 g)", cal:185, p:13.0, c:19.3, f:6.2, nutrs:[{n:"Fiber",amt:1.2,u:"g"},{n:"Sodium",amt:600.7,u:"mg"}]},
  {n:"On The Border, Soft Taco With Ground Beef, Cheese And Lettuce", s:"1 serving varied from 2-3 taco", cal:742, p:42.8, c:62.5, f:35.6, nutrs:[{n:"Fiber",amt:5.8,u:"g"},{n:"Sodium",amt:2093.0,u:"mg"}]},
  {n:"Fast Foods, Taco With Beef, Cheese And Lettuce, Hard Shell", s:"1 each taco (69 g)", cal:156, p:6.1, c:13.7, f:8.8, nutrs:[{n:"Fiber",amt:2.7,u:"g"},{n:"Sodium",amt:273.9,u:"mg"}]},
  {n:"Restaurant, Mexican, Soft Taco With Ground Beef, Cheese And Lettuce", s:"1 serving varied from 1 to 3 t", cal:615, p:35.4, c:50.3, f:30.3, nutrs:[{n:"Fiber",amt:4.2,u:"g"},{n:"Sodium",amt:1430.3,u:"mg"}]},
  {n:"Mission Foods, Mission Flour Tortillas, Soft Taco, 8 Inch", s:"1 serving (51 g)", cal:146, p:4.4, c:25.3, f:3.1, nutrs:[{n:"Sodium",amt:458.0,u:"mg"}]},
  {n:"Wendy's, Dave's Hot 'N Juicy 1/4 Lb, Single", s:"1 sandwich (215 g)", cal:576, p:29.5, c:38.1, f:34.0, nutrs:[{n:"Fiber",amt:2.4,u:"g"},{n:"Sodium",amt:1016.9,u:"mg"}]},
  {n:"Wendy's, Classic Single Hamburger, No Cheese", s:"1 item (218 g)", cal:464, p:27.5, c:36.6, f:23.1, nutrs:[{n:"Fiber",amt:2.8,u:"g"},{n:"Sodium",amt:861.1,u:"mg"}]},
  {n:"Wendy's, Classic Single Hamburger, With Cheese", s:"1 item (236 g)", cal:522, p:35.2, c:33.5, f:27.4, nutrs:[{n:"Fiber",amt:3.3,u:"g"},{n:"Sodium",amt:1123.4,u:"mg"}]},
  {n:"Kfc, Fried Chicken, Extra Crispy, Breast, Meat And Skin", s:"1 breast, bone and skin remove", cal:324, p:25.7, c:10.2, f:20.1, nutrs:[{n:"Sodium",amt:734.5,u:"mg"}]},
  {n:"Kfc, Fried Chicken, Original Recipe, Breast, Meat And Skin", s:"1 breast, without skin (152 g)", cal:351, p:33.3, c:9.5, f:19.9, nutrs:[{n:"Sodium",amt:921.1,u:"mg"}]},
  {n:"Kfc, Fried Chicken, Extra Crispy, Skin And Breading", s:"100 g", cal:464, p:11.0, c:22.5, f:36.6, nutrs:[{n:"Fiber",amt:1.5,u:"g"},{n:"Sodium",amt:828.0,u:"mg"}]},
  {n:"Kfc, Fried Chicken, Original Recipe, Skin And Breading", s:"100 g", cal:384, p:14.2, c:18.8, f:28.0, nutrs:[{n:"Sodium",amt:1040.0,u:"mg"}]},
  {n:"Pizza Hut 12\" Pepperoni Pizza, Pan Crust", s:"1 slice (96 g)", cal:286, p:11.5, c:29.3, f:13.6, nutrs:[{n:"Fiber",amt:1.7,u:"g"},{n:"Sodium",amt:664.3,u:"mg"}]},
  {n:"Pizza Hut 14\" Pepperoni Pizza, Pan Crust", s:"1 slice (113 g)", cal:329, p:13.0, c:35.9, f:14.8, nutrs:[{n:"Fiber",amt:2.3,u:"g"},{n:"Sodium",amt:763.9,u:"mg"}]},
  {n:"Pizza Hut 12\" Pepperoni Pizza, Hand-Tossed Crust", s:"1 pizza (744 g)", cal:2083, p:96.0, c:235.1, f:84.8, nutrs:[{n:"Fiber",amt:12.6,u:"g"},{n:"Sodium",amt:5959.4,u:"mg"}]},
  {n:"Domino'S 14\" Pepperoni Pizza, Crunchy Thin Crust", s:"1 slice (79 g)", cal:259, p:11.0, c:20.1, f:15.0, nutrs:[{n:"Fiber",amt:2.1,u:"g"},{n:"Sodium",amt:618.6,u:"mg"}]},
  {n:"Domino'S 14\" Pepperoni Pizza, Classic Hand-Tossed Crust", s:"1 slice (113 g)", cal:308, p:12.7, c:36.0, f:12.7, nutrs:[{n:"Fiber",amt:2.4,u:"g"},{n:"Sodium",amt:690.4,u:"mg"}]},
  {n:"Domino'S 14\" Pepperoni Pizza, Ultimate Deep Dish Crust", s:"1 pizza (984 g)", cal:2785, p:113.2, c:313.9, f:119.1, nutrs:[{n:"Fiber",amt:23.6,u:"g"},{n:"Sodium",amt:6819.1,u:"mg"}]},
  {n:"Chili With Beans, Microwavable Bowls", s:"1 container (422 g)", cal:422, p:24.7, c:46.0, f:15.5, nutrs:[{n:"Fiber",amt:12.2,u:"g"},{n:"Sodium",amt:1624.7,u:"mg"}]},
  {n:"Rice Bowl With Chicken, Frozen Entree", s:"1 bowl (340 g)", cal:428, p:19.2, c:76.5, f:5.3, nutrs:[{n:"Fiber",amt:2.4,u:"g"},{n:"Sodium",amt:1132.2,u:"mg"}]},
  {n:"Chicken Spread", s:"1 serving (1 serving) (56 g)", cal:88, p:10.1, c:2.3, f:9.9, nutrs:[{n:"Fiber",amt:0.2,u:"g"},{n:"Sodium",amt:404.3,u:"mg"}]},
  {n:"Chicken, Meatless", s:"1 cup (168 g)", cal:376, p:39.6, c:6.1, f:21.3, nutrs:[{n:"Fiber",amt:6.0,u:"g"},{n:"Sodium",amt:1191.1,u:"mg"}]},
  {n:"Popeyes, Biscuit", s:"1 biscuit (60 g)", cal:241, p:3.6, c:24.6, f:14.2, nutrs:[{n:"Fiber",amt:2.3,u:"g"},{n:"Sodium",amt:447.0,u:"mg"}]},
  {n:"Popeyes, Coleslaw", s:"1 cup (190 g)", cal:306, p:1.9, c:26.8, f:21.3, nutrs:[{n:"Fiber",amt:3.2,u:"g"},{n:"Sodium",amt:414.2,u:"mg"}]},
  {n:"Popeyes, Fried Chicken, Mild, Skin And Breading", s:"100 g", cal:433, p:14.0, c:21.5, f:32.3, nutrs:[{n:"Fiber",amt:1.0,u:"g"},{n:"Sodium",amt:769.0,u:"mg"}]},
  {n:"Restaurant, Chinese, Orange Chicken", s:"1 pieces (63 g)", cal:165, p:9.1, c:14.2, f:8.0, nutrs:[{n:"Fiber",amt:0.5,u:"g"},{n:"Sodium",amt:348.4,u:"mg"}]},
  {n:"Nuts, Coconut Cream, Raw (Liquid Expressed From Grated Meat)", s:"1 tbsp (15 g)", cal:50, p:0.5, c:1.0, f:5.2, nutrs:[{n:"Fiber",amt:0.3,u:"g"},{n:"Sodium",amt:0.6,u:"mg"}]},
  {n:"Nuts, Coconut Milk, Canned", s:"1 cup (226 g)", cal:445, p:4.6, c:6.4, f:48.1, nutrs:[{n:"Sodium",amt:29.4,u:"mg"}]},
  {n:"Subway, Turkey Breast Sub", s:"1 inch sub (367 g)", cal:539, p:33.5, c:82.2, f:8.5, nutrs:[{n:"Fiber",amt:4.8,u:"g"},{n:"Sodium",amt:1163.4,u:"mg"}]},
  {n:"Subway, Subway Club Sub", s:"1 inch sub (413 g)", cal:603, p:44.2, c:84.3, f:10.0, nutrs:[{n:"Fiber",amt:5.8,u:"g"},{n:"Sodium",amt:1437.2,u:"mg"}]},
  {n:"Subway, Meatball Marinara Sub", s:"1 inch sub (209 g)", cal:458, p:20.4, c:54.3, f:17.7, nutrs:[{n:"Fiber",amt:4.4,u:"g"},{n:"Sodium",amt:913.3,u:"mg"}]},
  {n:"Subway, Tuna Sub", s:"1 inch sub (237 g)", cal:524, p:29.2, c:37.9, f:28.4, nutrs:[{n:"Fiber",amt:1.7,u:"g"},{n:"Sodium",amt:779.7,u:"mg"}]},
  {n:"Burger King, Cheeseburger", s:"1 item (133 g)", cal:380, p:19.4, c:31.5, f:19.7, nutrs:[{n:"Fiber",amt:1.3,u:"g"},{n:"Sodium",amt:800.7,u:"mg"}]},
  {n:"McDonald's, Double Cheeseburger", s:"1 sandwich (155 g)", cal:437, p:24.0, c:29.1, f:25.0, nutrs:[{n:"Fiber",amt:1.2,u:"g"},{n:"Sodium",amt:1035.4,u:"mg"}]},
  {n:"Applebee'S, Double Crunch Shrimp", s:"1 serving (206 g)", cal:665, p:25.3, c:53.6, f:38.9, nutrs:[{n:"Fiber",amt:5.4,u:"g"},{n:"Sodium",amt:1726.3,u:"mg"}]},
  {n:"Burger King, Original Chicken Sandwich", s:"1 sandwich (199 g)", cal:569, p:24.1, c:52.1, f:29.3, nutrs:[{n:"Fiber",amt:4.8,u:"g"},{n:"Sodium",amt:1269.6,u:"mg"}]},
  {n:"Burger King, Vanilla Shake", s:"1 small 12 fl oz (298 g)", cal:501, p:9.5, c:56.6, f:26.0, nutrs:[{n:"Sodium",amt:298.0,u:"mg"}]},
  {n:"Milk Shakes, Thick Chocolate", s:"1 container (10.6 oz) (300 g)", cal:357, p:9.1, c:63.6, f:8.1, nutrs:[{n:"Fiber",amt:0.9,u:"g"},{n:"Sodium",amt:333.0,u:"mg"}]},
  {n:"Falafel, Home-Prepared", s:"1 patty (approx 2-1/4\" dia) (1", cal:57, p:2.3, c:5.4, f:3.0, nutrs:[{n:"Sodium",amt:50.0,u:"mg"}]},
  {n:"Hummus, Commercial", s:"1 tbsp (15 g)", cal:36, p:1.2, c:2.2, f:2.7, nutrs:[{n:"Fiber",amt:0.8,u:"g"},{n:"Sodium",amt:63.9,u:"mg"}]},
  {n:"Hummus, Home Prepared", s:"1 cup (246 g)", cal:435, p:12.0, c:49.4, f:21.1, nutrs:[{n:"Fiber",amt:9.8,u:"g"},{n:"Sodium",amt:595.3,u:"mg"}]},
  {n:"McDonald's, Sausage Burrito", s:"1 burrito (109 g)", cal:302, p:12.1, c:25.1, f:17.0, nutrs:[{n:"Fiber",amt:1.3,u:"g"},{n:"Sodium",amt:811.0,u:"mg"}]},
  {n:"Burrito, Bean And Cheese, Frozen", s:"1 burrito (129 g)", cal:285, p:9.1, c:43.9, f:8.1, nutrs:[{n:"Fiber",amt:4.4,u:"g"},{n:"Sodium",amt:452.8,u:"mg"}]},
  {n:"Burrito, Beef And Bean, Frozen", s:"1 oz (28.35 g)", cal:68, p:2.1, c:8.7, f:2.7, nutrs:[{n:"Fiber",amt:1.2,u:"g"},{n:"Sodium",amt:166.4,u:"mg"}]},
  {n:"Quest, Protein Chips, Salt & Vinegar, Salt & Vinegar", s:"1.125 ONZ", cal:120, p:21.0, c:5.0, f:2.0, nutrs:[{n:"Sodium",amt:289.9,u:"mg"}], b:"QUEST"},
  {n:"Clif Bar, Fruit + Nut Bar, Cashew", s:"100 g", cal:370, p:6.5, c:58.7, f:17.4, nutrs:[{n:"Fiber",amt:6.5,u:"g"},{n:"Sodium",amt:185.0,u:"mg"}], b:"CLIF BAR"},
  {n:"Clif Bar, Fruit + Nut Bar, Peanut Butter", s:"1 bar", cal:200, p:6.0, c:25.0, f:11.0, nutrs:[{n:"Fiber",amt:4.0,u:"g"},{n:"Sodium",amt:85.0,u:"mg"}], b:"CLIF BAR"},
  {n:"Clif Bar, Fruit + Nut Bar, Chocolate Almond", s:"1 BAR", cal:190, p:4.0, c:25.0, f:12.0, nutrs:[{n:"Fiber",amt:5.0,u:"g"},{n:"Sodium",amt:105.1,u:"mg"}], b:"CLIF BAR"},
  {n:"Clif Bar, Fruit + Seed Bar, Cherry + Pumpkin", s:"1 BAR", cal:170, p:4.0, c:32.0, f:4.0, nutrs:[{n:"Fiber",amt:4.0,u:"g"},{n:"Sodium",amt:70.1,u:"mg"}], b:"CLIF BAR"},
  {n:"Kind, Fruit & Nut Bar", s:"1 BAR", cal:210, p:6.0, c:14.0, f:16.0, nutrs:[{n:"Fiber",amt:3.0,u:"g"},{n:"Sodium",amt:10.0,u:"mg"}], b:"KIND"},
  {n:"Kind, Fruit & Nut Bar In Yogurt", s:"1 BAR", cal:200, p:5.0, c:19.0, f:13.0, nutrs:[{n:"Fiber",amt:2.5,u:"g"},{n:"Sodium",amt:15.2,u:"mg"}], b:"KIND"},
  {n:"Kind, Fruit & Nut Delight Bar", s:"1 BAR", cal:200, p:6.0, c:17.0, f:13.0, nutrs:[{n:"Fiber",amt:3.0,u:"g"},{n:"Sodium",amt:10.0,u:"mg"}], b:"KIND"},
  {n:"Protein Shake", s:"100 g", cal:56, p:5.6, c:3.1, f:2.2, nutrs:[{n:"Fiber",amt:0.3,u:"g"},{n:"Sodium",amt:73.0,u:"mg"}], b:"Ripple Foods"},
  {n:"Protein Shakes", s:"100 g", cal:64, p:5.1, c:8.1, f:1.7, nutrs:[{n:"Fiber",amt:1.7,u:"g"},{n:"Sodium",amt:78.0,u:"mg"}], b:"KELLOGG'S"},
  {n:"Fairlife Milk, Ultra- Filtered", s:"240 g", cal:100, p:13.0, c:6.0, f:2.5, nutrs:[{n:"Sodium",amt:120.0,u:"mg"}], b:"fairlife"},
  {n:"Premier White Morsels", s:"1 Tbsp", cal:80, p:1.0, c:9.0, f:4.0, nutrs:[{n:"Sodium",amt:9.9,u:"mg"}], b:"TOLL HOUSE"},
  {n:"Whey Protein Nutritional Supplement, Strawberry", s:"1 SCOOP", cal:123, p:23.0, c:5.0, f:1.0, nutrs:[{n:"Sodium",amt:67.9,u:"mg"}], b:"NEW SOLUTIONS NUTRITION"},
  {n:"Reserveage Nutrition, Grass-Fed Whey Protein", s:"1 SCOOP", cal:110, p:21.0, c:2.0, f:1.5, nutrs:[{n:"Sodium",amt:45.0,u:"mg"}], b:"RESERVEAGE NUTRITION"},
  {n:"Nature'S Path, Optimum Slim Cereal, Vanilla", s:"1 cup", cal:200, p:9.0, c:40.0, f:2.0, nutrs:[{n:"Fiber",amt:9.0,u:"g"},{n:"Sodium",amt:289.9,u:"mg"}], b:"NATURE'S PATH"},
  {n:"Chobani Yogurt, Greek, Blended, Coffee", s:"150 g", cal:140, p:11.0, c:18.0, f:2.5, nutrs:[{n:"Sodium",amt:64.9,u:"mg"}], b:"Chobani"},
  {n:"Chobani Plain Non- Fat Greek Yogurt", s:"180 g", cal:90, p:16.0, c:6.0, f:0.0, nutrs:[{n:"Sodium",amt:65.0,u:"mg"}], b:"Chobani"},
  {n:"Simply Jif Creamy Peanut Butter", s:"2 Tbsp", cal:200, p:7.0, c:7.0, f:17.0, nutrs:[{n:"Fiber",amt:3.0,u:"g"},{n:"Sodium",amt:65.0,u:"mg"}], b:"Jif"},
  {n:"Jif To Go Creamy Peanut Butter", s:"1 unit", cal:180, p:7.0, c:8.0, f:15.0, nutrs:[{n:"Fiber",amt:2.0,u:"g"},{n:"Sodium",amt:130.1,u:"mg"}], b:"Jif"},
  {n:"Nutella With Breadsticks", s:"1 CONTAINER", cal:270, p:4.0, c:34.0, f:14.0, nutrs:[{n:"Fiber",amt:2.0,u:"g"},{n:"Sodium",amt:130.0,u:"mg"}], b:"NUTELLA FERRERO"},
  {n:"Nutella Crispy Wafer", s:"1 bar (22g)", cal:110, p:2.0, c:14.0, f:6.0, nutrs:[{n:"Fiber",amt:1.0,u:"g"},{n:"Sodium",amt:49.9,u:"mg"}], b:"NUTELLA"},
  {n:"Quaker Oat Flour", s:"1/4 cup (30g)", cal:110, p:4.0, c:20.0, f:2.0, nutrs:[{n:"Fiber",amt:3.0,u:"g"}], b:"QUAKER"},
  {n:"Quaker Oats Old Fashioned 42 Oz", s:"1/2 cup dry (40 g)", cal:150, p:5.0, c:27.0, f:3.0, nutrs:[{n:"Fiber",amt:4.0,u:"g"}], b:"Quaker"},
  {n:"Quaker Old Fashioned Oats 42 Oz", s:"1/2 cup dry (40 g)", cal:150, p:5.0, c:27.0, f:3.0, nutrs:[{n:"Fiber",amt:4.0,u:"g"}], b:"Quaker"},
  {n:"Cheerios Cereal", s:"3/4 cup (20g) (age 1-3 years)", cal:23, p:1.1, c:4.3, f:0.4, nutrs:[{n:"Fiber",amt:0.5,u:"g"},{n:"Sodium",amt:30.8,u:"mg"}], b:"Cheerios"},
  {n:"Gruma, Mission, Fajita Flour Tortillas", s:"1 TORTILLA", cal:110, p:3.0, c:18.0, f:2.5, nutrs:[{n:"Fiber",amt:1.0,u:"g"},{n:"Sodium",amt:310.0,u:"mg"}], b:"GRUMA"},
  {n:"Flour Tortilla, Flour", s:"1 Tortilla", cal:330, p:7.0, c:50.0, f:12.0, nutrs:[{n:"Fiber",amt:2.0,u:"g"},{n:"Sodium",amt:260.0,u:"mg"}], b:"NORTHGATE MARKET"},
  {n:"Flour Tortillas, Flour", s:"1 tortilla", cal:120, p:4.0, c:21.0, f:2.5, nutrs:[{n:"Fiber",amt:2.0,u:"g"},{n:"Sodium",amt:369.8,u:"mg"}], b:"FIRST STREET"},
  {n:"Dave'S Killer Bread, White Bread", s:"1 SLICE", cal:110, p:3.0, c:21.0, f:2.0, nutrs:[{n:"Fiber",amt:2.0,u:"g"},{n:"Sodium",amt:190.0,u:"mg"}], b:"DAVE'S KILLER BREAD"},
  {n:"Dave'S Killer Bread, Organic Spelt Bread", s:"1 SLICE", cal:130, p:4.0, c:24.0, f:2.0, nutrs:[{n:"Fiber",amt:2.0,u:"g"},{n:"Sodium",amt:189.9,u:"mg"}], b:"DAVE'S KILLER BREAD"},
  {n:"Kraft Mozzarella String Cheese, 12 Ct", s:"28 g", cal:80, p:7.0, c:1.0, f:5.0, nutrs:[{n:"Sodium",amt:180.0,u:"mg"}], b:"Kraft"},
  {n:"Kraft Mozzarella String Cheese Sticks", s:"28 g", cal:80, p:7.0, c:1.0, f:5.0, nutrs:[{n:"Sodium",amt:180.0,u:"mg"}], b:"Kraft"},
  {n:"Daisy Cottage Cheese, 2% Milkfat, Low Fat", s:"120 g", cal:90, p:13.0, c:5.0, f:2.0, nutrs:[{n:"Sodium",amt:360.0,u:"mg"}], b:"Daisy"},
  {n:"Bananas, Raw", s:"1 NLEA serving (126 g)", cal:112, p:1.4, c:28.7, f:0.4, nutrs:[{n:"Fiber",amt:3.3,u:"g"},{n:"Sodium",amt:1.3,u:"mg"}]},
  {n:"Pepper, Banana, Raw", s:"1 cup (124 g)", cal:33, p:2.1, c:6.6, f:0.6, nutrs:[{n:"Fiber",amt:4.2,u:"g"},{n:"Sodium",amt:16.1,u:"mg"}]},
  {n:"Chicken Breast, Skinless, Boneless", s:"1 oz (85 g)", cal:128, p:25.9, c:0.0, f:2.7, nutrs:[{n:"Sodium",amt:44.2,u:"mg"}]},
  {n:"Wendy's, Ultimate Chicken Grill Sandwich", s:"1 item (225 g)", cal:403, p:33.1, c:42.5, f:11.2, nutrs:[{n:"Fiber",amt:2.5,u:"g"},{n:"Sodium",amt:960.8,u:"mg"}]},
  {n:"Rice, White, Glutinous, Unenriched, Cooked", s:"1 cup (174 g)", cal:169, p:3.5, c:36.7, f:0.3, nutrs:[{n:"Fiber",amt:1.7,u:"g"},{n:"Sodium",amt:8.7,u:"mg"}]},
  {n:"Rice, White, Medium-Grain, Cooked, Unenriched", s:"1 cup (186 g)", cal:242, p:4.4, c:53.2, f:0.4},
  {n:"Rice, Brown, Parboiled, Cooked, Uncle Bens", s:"1 cup (155 g)", cal:228, p:4.8, c:48.5, f:1.3, nutrs:[{n:"Fiber",amt:2.6,u:"g"},{n:"Sodium",amt:6.2,u:"mg"}]},
  {n:"Pork Sausage Rice Links, Brown And Serve, Cooked", s:"1 links 1 NLEA serving (60 g)", cal:244, p:8.2, c:1.4, f:22.6, nutrs:[{n:"Sodium",amt:413.4,u:"mg"}]},
  {n:"Pasta, Cooked, Enriched, With Added Salt", s:"1 cup rotini (107 g)", cal:168, p:6.2, c:32.7, f:1.0, nutrs:[{n:"Fiber",amt:1.9,u:"g"},{n:"Sodium",amt:140.2,u:"mg"}]},
  {n:"Pasta, Cooked, Unenriched, With Added Salt", s:"1 cup spaghetti packed (151 g)", cal:237, p:8.8, c:46.2, f:1.4, nutrs:[{n:"Fiber",amt:2.7,u:"g"},{n:"Sodium",amt:197.8,u:"mg"}]},
  {n:"Sweet Potato, Frozen, Cooked, Baked, With Salt", s:"1 cup, cubes (176 g)", cal:176, p:3.0, c:41.2, f:0.2, nutrs:[{n:"Fiber",amt:3.2,u:"g"},{n:"Sodium",amt:429.4,u:"mg"}]},
  {n:"Sweet Potato, Cooked, Baked In Skin, Flesh, With Salt", s:"1 cup, mashed (100 g)", cal:90, p:2.0, c:20.7, f:0.1, nutrs:[{n:"Fiber",amt:3.3,u:"g"},{n:"Sodium",amt:246.0,u:"mg"}]},
  {n:"Avocados, Raw, California", s:"1 fruit, without skin and seed", cal:227, p:2.7, c:11.8, f:20.9, nutrs:[{n:"Fiber",amt:9.2,u:"g"},{n:"Sodium",amt:10.9,u:"mg"}]},
  {n:"Avocados, Raw, Florida", s:"1 fruit without skin and seeds", cal:365, p:6.8, c:23.8, f:30.7, nutrs:[{n:"Fiber",amt:17.0,u:"g"},{n:"Sodium",amt:6.1,u:"mg"}]},
  {n:"Egg, Whole, Dried", s:"1 cup, sifted (85 g)", cal:503, p:40.8, c:1.0, f:37.3, nutrs:[{n:"Sodium",amt:404.6,u:"mg"}]},
  {n:"Egg, Whole, Cooked, Fried", s:"1 large (46 g)", cal:90, p:6.3, c:0.4, f:6.8, nutrs:[{n:"Sodium",amt:95.2,u:"mg"}]},
  {n:"Fish Oil, Salmon", s:"1 tsp (4.5 g)", cal:41, p:0.0, c:0.0, f:4.5},
  {n:"Fish, Salmon, Chinook, Raw", s:"1 fillet (198 g)", cal:354, p:39.4, c:0.0, f:20.6, nutrs:[{n:"Sodium",amt:93.1,u:"mg"}]},
  {n:"Beef, Ground, 80% Lean Meat / 20% Fat, Raw", s:"1 oz (113 g)", cal:287, p:19.4, c:0.0, f:22.6, nutrs:[{n:"Sodium",amt:74.6,u:"mg"}]},
  {n:"Beef, Ground, 80% Lean Meat / 20% Fat, Loaf, Cooked, Baked", s:"1 oz (85 g)", cal:216, p:21.4, c:0.0, f:13.8, nutrs:[{n:"Sodium",amt:56.9,u:"mg"}]},
  {n:"Pork, Cured, Bacon, Unprepared", s:"1 package (442 g)", cal:1737, p:60.6, c:0.0, f:164.0, nutrs:[{n:"Sodium",amt:3319.4,u:"mg"}]},
  {n:"Pork, Cured, Bacon, Cooked, Baked", s:"1 slice cooked (8.1 g)", cal:44, p:2.9, c:0.1, f:3.5, nutrs:[{n:"Sodium",amt:177.4,u:"mg"}]}];

const MEALS = ["breakfast","lunch","dinner","snacks","supplements"];
/* Fresh-app defaults (2026.11.01-a): no personal data ships in the code — no name,
   no photos, no bottles, no backup. A new install starts completely blank. */
const DEFAULT_BOTTLES = [{"id":"b0","name":"Glass","oz":8}];
const DEFAULT_PROFILE = {name:"", img:"", theme:"#5b5bf0"};
const MEAL_LABEL = {breakfast:"Breakfast", lunch:"Lunch", dinner:"Dinner", snacks:"Snacks", supplements:"Supplements"};
const MEAL_ICON = {
  breakfast:'<svg viewBox="0 0 24 24" fill="none" stroke="#ff9f43" stroke-width="2" stroke-linecap="round"><path d="M12 3v3M5.6 5.6l2.1 2.1M18.4 5.6l-2.1 2.1"/><path d="M7 15a5 5 0 0 1 10 0"/><path d="M3 15h18M6 18.5h12"/></svg>',
  lunch:'<svg viewBox="0 0 24 24" fill="none" stroke="#ff9f43" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="4.2"/><path d="M12 2.5v2.6M12 18.9v2.6M2.5 12h2.6M18.9 12h2.6M5 5l1.8 1.8M17.2 17.2 19 19M19 5l-1.8 1.8M6.8 17.2 5 19"/></svg>',
  dinner:'<svg viewBox="0 0 24 24" fill="none" stroke="#7e7ef2" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 14.5A8.5 8.5 0 0 1 9.5 4a8.5 8.5 0 1 0 10.5 10.5z"/></svg>',
  snacks:'<svg viewBox="0 0 24 24" fill="none" stroke="#b07d4f" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="8.5"/><circle cx="9.5" cy="10" r="1" fill="#b07d4f" stroke="none"/><circle cx="14.5" cy="9" r="1" fill="#b07d4f" stroke="none"/><circle cx="11" cy="14.5" r="1" fill="#b07d4f" stroke="none"/><circle cx="15" cy="14" r="1" fill="#b07d4f" stroke="none"/></svg>',
  supplements:'<svg viewBox="0 0 24 24" fill="none" style="stroke:var(--acc)" stroke-width="2" stroke-linecap="round"><rect x="3.5" y="9" width="17" height="7" rx="3.5" transform="rotate(-35 12 12.5)"/><line x1="10.2" y1="7.4" x2="13.8" y2="17.6"/></svg>'
};
const MEAL_TINT = {breakfast:"#fff3e2", lunch:"#fff3e2", dinner:"#eceeff", snacks:"#f3e9dc", supplements:"#eceeff"};
const FOOD_ICON = '<svg viewBox="0 0 24 24" fill="none" style="stroke:var(--acc)" stroke-width="2" stroke-linecap="round"><path d="M4 16.5h16"/><path d="M6.5 16.5a5.5 5.5 0 0 1 11 0"/><path d="M12 8.5v2"/><circle cx="12" cy="7" r="1.1" style="fill:var(--acc)" stroke="none"/></svg>';
const MEAL_SEG = {breakfast:"#ffdca8", lunch:"#ffab3d", dinner:"#ff8f3d", snacks:"#ff7f2a", supplements:"#8b8bf5"};
const STAR_ON = '<svg viewBox="0 0 24 24" width="20" height="20" fill="#e8a013"><path d="M12 2.6l2.9 5.9 6.5 1-4.7 4.6 1.1 6.5L12 17.5l-5.8 3.1 1.1-6.5L2.6 9.5l6.5-1z"/></svg>';
const STAR_OFF = '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="#aeb9c4" stroke-width="1.8" stroke-linejoin="round"><path d="M12 2.6l2.9 5.9 6.5 1-4.7 4.6 1.1 6.5L12 17.5l-5.8 3.1 1.1-6.5L2.6 9.5l6.5-1z"/></svg>';
const ICONS = {
  warn:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3.5 2.8 19.5h18.4L12 3.5z"/><line x1="12" y1="9.5" x2="12" y2="13.8"/><circle cx="12" cy="16.8" r="1.1" fill="currentColor" stroke="none"/></svg>',
  up:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><polyline points="4 17 10 11 13.5 14.5 20 8"/><polyline points="15 8 20 8 20 13"/></svg>',
  check:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="8.5"/><polyline points="8.3 12.3 11 15 15.8 9.6"/></svg>'
};
const FLAGI = '<svg class="fico" viewBox="0 0 24 24"><path d="M6 3v18" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" fill="none"/><path d="M8.5 4H20l-2.8 3.8L20 11.5H8.5z" fill="currentColor"/></svg>';
const KEY = "fuel.v1";
const FLAG_KEY = "fuel.flags.v1"; /* tiny key for one-time flags: a full-storage save failure can never block these */
/* storage-full guard: progress photos are the bulk of the state; if the phone is out of
   localStorage, drop the oldest photos until the state fits so food/weight/training logs survive */
function isQuotaErr(e){ return !!e && (e.code===22 || e.code===1014 || e.name==="QuotaExceededError" || e.name==="NS_ERROR_DOM_QUOTA_REACHED"); }
function flagGet(){ try{ return JSON.parse(localStorage.getItem(FLAG_KEY)||"{}"); }catch(e){ return {}; } }
let flagPending = null; /* 2026.10.09-h: flags that could not persist (quota-full boot) retry on the next save */
function flagSet(k,v){ try{ const f=flagGet(); f[k]=v; localStorage.setItem(FLAG_KEY, JSON.stringify(f)); }
  catch(e){ if(isQuotaErr(e)){ (flagPending||(flagPending={}))[k]=v; } } }
function flagFlush(){ if(!flagPending) return; const p=flagPending; flagPending=null;
  try{ const f=flagGet(); for(const k in p) f[k]=p[k]; localStorage.setItem(FLAG_KEY, JSON.stringify(f)); }
  catch(e){ flagPending=p; } }
let warnLock = false; /* 2026.10.09-h: locked warnings (e.g. corruption restore) stay until tapped */
function showSaveWarn(msg, lock){ const b=document.getElementById("saveWarn"); if(b){ b.textContent=msg; b.hidden=false; b.onclick=()=>{ warnLock=false; hideSaveWarn(); }; if(lock) warnLock=true; } }
function hideSaveWarn(){ if(warnLock) return; const b=document.getElementById("saveWarn"); if(b) b.hidden=true; }
function save(){
  try{ localStorage.setItem(KEY, JSON.stringify(S)); hideSaveWarn(); flagFlush(); takeSnapshot(); return true; }
  catch(e){ return isQuotaErr(e) ? saveTrimPhotos() : (showSaveWarn("Couldn't save — storage error."), false); }
}
/* ============ AUTOMATIC SNAPSHOTS (2026.09.24-e) ============
   One best-effort snapshot of fuel.v1 per day under a separate key. Snapshots
   are NEVER a substitute for export: they live in the same browser storage as
   the live data, so they guard against in-app corruption, not a lost phone.
   Quota-safe: snapshots stay under ~4MB total and silently skip before they can
   ever crowd out the live save. If they still crowd it (the ~5MB origin quota is
   shared), the live save reclaims the oldest snapshots first. fuel.v1 itself is never touched. */
const SNAP_PRE = "fuel.snap.", SNAP_KEEP = 7, SNAP_BUDGET = 4*1024*1024;
function listSnapshots(){
  const out = [];
  try{
    for(let i=0;i<localStorage.length;i++){ const k=localStorage.key(i); if(k&&k.indexOf(SNAP_PRE)===0) out.push(k); }
  }catch(e){}
  return out.sort().reverse(); /* newest first */
}
function takeSnapshot(){
  try{
    const raw = localStorage.getItem(KEY);
    if(!raw || raw.length<200) return;
    const k = SNAP_PRE+todayStr();
    if(localStorage.getItem(k)) return; /* one per day */
    let keys = listSnapshots(), bytes = raw.length;
    keys.forEach(kk=>{ bytes += ((localStorage.getItem(kk)||"").length); });
    while(keys.length && (bytes>SNAP_BUDGET || keys.length>=SNAP_KEEP)){
      const old = keys.pop(); bytes -= ((localStorage.getItem(old)||"").length); localStorage.removeItem(old);
    }
    if(bytes>SNAP_BUDGET) return; /* still over budget: skip, never risk the live save */
    localStorage.setItem(k, raw);
  }catch(e){ /* best-effort: snapshots must never break the app */ }
}
function renderSnaps(){
  const box = document.getElementById("snapList");
  if(!box) return;
  const keys = listSnapshots();
  if(!keys.length){
    box.innerHTML = '<div class="empty">No snapshots yet — one is saved automatically the first time you log something each day.</div>';
    return;
  }
  box.innerHTML = keys.map(k=>{
    const ds = k.slice(SNAP_PRE.length);
    let kb = 0; try{ kb = Math.round(((localStorage.getItem(k)||"").length)/1024); }catch(e){}
    const dt = new Date(ds+"T12:00:00");
    const label = dt.toLocaleDateString(undefined,{weekday:"short", month:"short", day:"numeric"});
    return '<div style="display:flex;align-items:center;justify-content:space-between;padding:9px 0;border-bottom:1px solid var(--line)">'
      + '<div><b>'+esc(label)+'</b><div class="rangenote">'+kb+' KB</div></div>'
      + '<button class="wlink" data-snap="'+esc(k)+'">Restore</button></div>';
  }).join("");
  box.querySelectorAll("[data-snap]").forEach(b=>b.onclick=()=>{
    const k = b.dataset.snap;
    let raw = null; try{ raw = localStorage.getItem(k); }catch(e){}
    if(!raw){ alert("That snapshot is gone."); renderSnaps(); return; }
    try{ JSON.parse(raw); }catch(e){ alert("That snapshot is corrupted and can't be restored."); return; }
    if(!confirm("Restore the snapshot from "+k.slice(SNAP_PRE.length)+"? Today's newer changes will be replaced.")) return;
    try{ localStorage.setItem(KEY, raw); }catch(e){ alert("Couldn't restore — storage error."); return; }
    location.reload();
  });
}
function dropOldestMealPhoto(){
  const keys = Object.keys(S.days||{}).sort(); /* ISO dates sort oldest-first */
  for(const k of keys){
    const dd = S.days[k]; if(!dd || !dd.meals) continue;
    for(const m of MEALS){ const arr = dd.meals[m]||[];
      for(const e of arr){ if(e && e.img){ e.img = null; return true; } } }
  }
  return false;
}
function saveTrimPhotos(){
  const photos = (S.profile && S.profile.photos) || [];
  let dropped = 0, snapsDropped = 0, mealDropped = 0;
  for(;;){
    try{ localStorage.setItem(KEY, JSON.stringify(S)); hideSaveWarn(); break; }
    catch(e){
      if(!isQuotaErr(e)){ showSaveWarn("Couldn't save — storage error."); return false; }
      if(photos.length){
        let oldest = 0;
        for(let i=1;i<photos.length;i++) if(photos[i].d < photos[oldest].d) oldest = i;
        photos.splice(oldest,1); dropped++;
        continue;
      }
      /* No progress photos left: meal-entry photos are next (oldest day first) —
         2026.10.09-h: these were unbounded and the trimmer never touched them. */
      if(dropOldestMealPhoto()){ mealDropped++; continue; }
      /* No meal photos left either: snapshots are expendable backups sharing the same
         ~5MB origin quota, so drop the oldest one and retry before giving up. */
      const snaps = listSnapshots(); /* newest first */
      if(!snaps.length){ showSaveWarn("Fuel is out of storage space — delete old food photos, then reopen Fuel."); return false; }
      try{ localStorage.removeItem(snaps[snaps.length-1]); }catch(_){}
      snapsDropped++;
    }
  }
  if(dropped>0 || snapsDropped>0 || mealDropped>0){
    const bits = [];
    if(dropped>0) bits.push("removed "+dropped+" oldest progress photo"+(dropped>1?"s":""));
    if(mealDropped>0) bits.push("removed "+mealDropped+" oldest meal photo"+(mealDropped>1?"s":""));
    if(snapsDropped>0) bits.push("removed "+snapsDropped+" old backup snapshot"+(snapsDropped>1?"s":""));
    showSaveWarn("Storage was full — "+bits.join(" and ")+" to protect your logs. Your food, weight and training data is safe.");
  }
  return true;
}
const APP_VERSION = "2026.11.25-d";

/* ============ STATE ============ */
/* Blank slate: every goal, nutrient target, and profile/setting starts at zero, like a
   new app — Jay fills them in himself. (2026.09.18-ak) */
const defProfile = () => ({units:"imp", sex:"", age:0, heightIn:0, weightLb:0, bodyFat:0, waistIn:0, activityKey:"", auto:false});
const defGoals = () => ({maintenance:0, surplus:0, protein:0, carbs:0, fat:0, water:0, waterV:1, weight:0, weightStart:0, mode:"custom", nutrTargets:{}, profile:defProfile(), muscleGoal:0, macroAuto:true, adaptive:null, adaptiveHist:[], useAdaptive:false, adTuneNote:""});
/* freshBoot is true when the app starts with no saved state (fresh install /
   cleared storage). The app starts blank — there is no bundled backup to restore. */
let freshBoot = false;
let corruptBoot = false, corruptRaw = ""; /* 2026.10.09-h: fuel.v1 existed but would not parse */
function load(){
  let raw = null;
  try{ raw = localStorage.getItem(KEY); }catch(e){}
  try { const s = JSON.parse(raw); if (s && s.goals) {
/* 2026.10.21-e (audit): legacy numeric activity factor -> tier key, BEFORE the profile
   default-fill below stamps activityKey:"" and makes migration impossible. Map matches
   ACT_TIERS exactly (the old post-fill migration was unreachable AND shifted by a tier). */
const prA = s.goals.profile; if(prA && typeof prA.activity==="number" && !prA.activityKey){ const mA={1.2:"sedentary",1.375:"light",1.465:"moderate",1.55:"active",1.725:"very",1.9:"extra"}; prA.activityKey = mA[prA.activity]||"moderate"; delete prA.activity; }
/* 2026.09.18-ak blank-slate reset: Jay asked for every goal, nutrient target, and profile/setting
   at zero like a new app. Runs once — his logged days, custom foods, weights, and training stay.
   The "ran once" flag lives in FLAG_KEY (not inside the state) so a full-storage save failure
   can never make the reset fire again. */
if(s.zeroReset) flagSet("zeroReset",1);
delete s.zeroReset;
delete s.packPoints; delete s.cards; delete s.packStats; /* pack shop removed 2026.09.18-ax */
if(!flagGet().zeroReset){ if(!s.zeroResetDone) s.goals = defGoals(); s.zeroResetDone = 1; flagSet("zeroReset",1); }
else { s.zeroResetDone = 1; const dg = defGoals(); for(const k in dg) if(s.goals[k]===undefined) s.goals[k]=dg[k]; const dp = defProfile(); if(!s.goals.profile) s.goals.profile = dp; else for(const k in dp) if(s.goals.profile[k]===undefined) s.goals.profile[k]=dp[k]; }
delete s.goals.cal;
/* migrate legacy numeric activity factor to tier key */
if(s.goals.profile.activityKey===undefined){ const m={1.2:"sedentary",1.375:"light",1.55:"moderate",1.725:"active",1.9:"very"}; s.goals.profile.activityKey = m[s.goals.profile.activity]||"moderate"; delete s.goals.profile.activity; } if(!s.goals.mode) s.goals.mode = "custom"; if(!s.goals.waterV){ s.goals.water = 0; s.goals.waterV = 1; } s.favorites = (s.favorites||[]).filter(n=>n!=="CAVA bowl, dbl chicken"); if(!s.training) s.training = {sched:{}, done:{}, deloads:{}}; if(!s.training.deloads) s.training.deloads = {}; if(!s.profile) s.profile = {name:DEFAULT_PROFILE.name, img:DEFAULT_PROFILE.img, theme:DEFAULT_PROFILE.theme};
else { if(!/^#[0-9a-fA-F]{6}$/.test(s.profile.theme)) s.profile.theme = DEFAULT_PROFILE.theme; if(!s.profile.name) s.profile.name = DEFAULT_PROFILE.name; if(!s.profile.img) s.profile.img = DEFAULT_PROFILE.img; } /* default name/photo/theme 2026.09.21-g */
  if(!Array.isArray(s.profile.photos)) s.profile.photos = []; /* fresh app: photos start empty — nothing is seeded (2026.11.01-a) */
  /* Water 2.0: intake moves from glasses to fluid oz; bottles are user-defined */
  if(!s.waterV2){ for(const k in (s.days||{})){ const dd=s.days[k]; if(dd.waterOz===undefined) dd.waterOz=Math.round(((dd.water||0)*8)*10)/10; delete dd.water; } s.waterV2=1; }
  if(!Array.isArray(s.bottles) || !s.bottles.length || (s.bottles.length===1 && s.bottles[0].id==="b0" && s.bottles[0].name==="Glass" && s.bottles[0].oz===8 && !s.bottles[0].img)) s.bottles = DEFAULT_BOTTLES.map(b=>({id:b.id, name:b.name, oz:b.oz, img:b.img})); /* default bottles 2026.09.21-h: untouched default -> Jay's 3 */
  if(!Array.isArray(s.recipes)) s.recipes=[]; /* recipes added 2026-09-18 */
  if(!Array.isArray(s.groceries)) s.groceries=[]; /* weekly grocery list 2026.11.12-a */
  if(!flagGet().testPurge){ s.customFoods=(s.customFoods||[]).filter(f=>f.test!==1); flagSet("testPurge",1); } /* test-foods debug feature removed 2026.09.20-cq */
  if(!flagGet().ggAbbr){ const pre="Good & Gather ", rep="G&G ", have=new Set((s.customFoods||[]).map(f=>f.n));
    (s.customFoods||[]).forEach(f=>{ if(f.n.indexOf(pre)===0){ const nn=rep+f.n.slice(pre.length); if(!have.has(nn)){ have.delete(f.n); have.add(nn);
      const on=f.n; f.n=nn;
      (s.favorites||[]).forEach((x,i)=>{ if(x===on) s.favorites[i]=nn; });
      Object.values(s.days||{}).forEach(d=>MEALS.forEach(m=>((d.meals||{})[m]||[]).forEach(e=>{ if(e.n===on) e.n=nn; }))); } } });
    flagSet("ggAbbr",1); } /* Good & Gather -> G&G label abbreviation 2026.09.20-cs */
  if(!flagGet().crabFix){ /* 2026.10.01-e: Jay's custom food typo "Crab Balance" -> "Carb Balance" */
    (s.customFoods||[]).forEach(function(f){ if(f.n && f.n.indexOf("Crab Balance")>=0){ var on=f.n, nn=on.replace("Crab Balance","Carb Balance"); f.n=nn;
      (s.favorites||[]).forEach(function(x,i){ if(x===on) s.favorites[i]=nn; });
      Object.values(s.days||{}).forEach(function(d){ MEALS.forEach(function(m){ ((d.meals||{})[m]||[]).forEach(function(e){ if(e && e.n===on) e.n=nn; }); }); }); } });
    flagSet("crabFix",1); }
  if(!Array.isArray(s.customFoods)) s.customFoods=[]; if(!Array.isArray(s.weights)) s.weights=[]; if(!Array.isArray(s.pmWeights)) s.pmWeights=[];
  if(!Array.isArray(s.favorites)) s.favorites=[]; if(!s.days||typeof s.days!=="object") s.days={};
  /* missing keys (old/corrupt stores) must not crash render paths that .slice() them 2026.09.24-e */
  /* 2026.10.01-d: purge dead (null/undefined) entries from meal arrays — an
     interrupted write can leave holes, and a single hole crashed boot-time
     totals/tired-model loops that read e.t / e.cal unguarded. */
  Object.values(s.days||{}).forEach(function(d){ if(!d||!d.meals) return; MEALS.forEach(function(m){ if(Array.isArray(d.meals[m])) d.meals[m] = d.meals[m].filter(function(e){ return !!e; }); }); });
  return s; } } catch(e){ corruptBoot = (raw!==null && raw!==""); corruptRaw = raw||""; }
  if(raw && String(raw).trim() && String(raw).trim()!=="null" && !corruptBoot){ corruptBoot = true; corruptRaw = raw; } /* 2026.10.21-e (audit): valid JSON without goals is damage, not a fresh install — stash + snapshot-restore it like a parse failure */
  flagSet("zeroReset",1); /* fresh boot / unreadable state: nothing to reset, mark it done */
  freshBoot = true; /* fresh install: the blank state below is the whole story */
  return {zeroResetDone:1, days:{}, customFoods:[], favorites:[], weights:[], pmWeights:[], goals:defGoals(), training:{sched:{}, done:{}, deloads:{}}, profile:{name:DEFAULT_PROFILE.name, img:DEFAULT_PROFILE.img, theme:DEFAULT_PROFILE.theme, photos:[]}, bottles:DEFAULT_BOTTLES.map(b=>({id:b.id, name:b.name, oz:b.oz, img:b.img})), waterV2:1, recipes:[], groceries:[], mealTimes:{breakfast:[], lunch:[], dinner:[], snacks:[]}};
}
let S = load();
/* Streaks start empty on a fresh app (2026.11.01-a): no quit date is baked into
   the code — the user sets their own last-use day. Additive only. */
(function(){
  try{
    if(!S.streaks) S.streaks = {};
    if(!S.streaks.nicotine) S.streaks.nicotine = { lastUse:null };
    if(!S.streaks.alcohol) S.streaks.alcohol = { lastUse:null };
  }catch(e){}
})();
/* 2026.09.23-e: meal-time learning. Every food log records minutes-since-midnight
   per meal (last 30 kept). Powers the day-cycle panel's learned meal dots, the
   "best window to eat" insight, and the tired model's real meal times. */
/* the four food meals learn timing; supplements never did (nothing reads them) */
const LEARN_MEALS = ["breakfast","lunch","dinner","snacks"];
if(!S.mealTimes || typeof S.mealTimes!=="object"){
  S.mealTimes = {breakfast:[], lunch:[], dinner:[], snacks:[]};
}else{
  LEARN_MEALS.forEach(m=>{ if(!Array.isArray(S.mealTimes[m])) S.mealTimes[m]=[]; });
  delete S.mealTimes.supplements; /* write-only dead key from the MEALS loop */
}
delete S.logLagMin; /* 2026.09.27-b: log-lag option removed per Jay */
/* 2026.09.27-b: work/off day types. Work days run a different meal schedule,
   so meal times are learned separately per day type and the card shows today's type. */
if(!S.dayTypeOv || typeof S.dayTypeOv!=="object") S.dayTypeOv = {};
/* 2026.09.27-d: editable weekly work schedule (Settings › Work schedule).
   Stored as JS weekday numbers (0=Sun..6=Sat); no default — set in Settings. */
const WORK_WEEKDAYS_DEF = []; /* fresh app: no work days until the user sets their schedule */
if(!Array.isArray(S.workDays)) S.workDays = WORK_WEEKDAYS_DEF.slice();
/* 2026.09.27-i: nutrition calendar blocks. Weekly-recurring entries:
   {id, kind:"work"|"gym"|"custom", label, days:[0..6 Sun..Sat],
    start/end = minutes since midnight, color}. */
function workDays(){ return Array.isArray(S.workDays) ? S.workDays.filter(x=>x>=0&&x<=6) : WORK_WEEKDAYS_DEF.slice(); }
function isWorkDayAuto(kstr){
  return workDays().indexOf(new Date(kstr+"T12:00:00").getDay())>=0;
}
function dayType(kstr){
  const ov = (S.dayTypeOv||{})[kstr];
  if(ov==="work" || ov==="off") return ov;
  return isWorkDayAuto(kstr) ? "work" : "off";
}
/* 2026.09.27-d: work schedule editor (Settings › Work schedule) */
const WD_NAMES = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];
const WD_SHORT = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];
const WD_LET = ["S","M","T","W","T","F","S"];
const WD_ORDER = [1,2,3,4,5,6,0]; /* week strip starts Monday */
function workDaysSummary(){
  const w = workDays();
  if(!w.length) return "No work days";
  if(w.length>=7) return "Every day";
  return WD_ORDER.filter(d=>w.indexOf(d)>=0).map(d=>WD_SHORT[d]).join(" · ");
}
let wsSel = new Date().getDay();
function setWorkDay(d, on){
  const w = workDays().filter(x=>x!==d);
  if(on) w.push(d);
  S.workDays = w;
  /* keep today's one-off pill honest: drop the override if it now matches the schedule */
  const k = todayStr(), ov = (S.dayTypeOv||{})[k];
  if(ov && ov===(isWorkDayAuto(k)?"work":"off")) delete S.dayTypeOv[k];
  save(); renderWorkSched(); renderAll();
}
function renderWorkSched(){
  const w = workDays(), strip = $("wStrip");
  if(!strip) return;
  strip.innerHTML = "";
  WD_ORDER.forEach(d=>{
    const on = w.indexOf(d)>=0;
    const b = document.createElement("button");
    b.className = "wday"+(on?" on":"")+(d===wsSel?" sel":"");
    b.setAttribute("aria-label", WD_NAMES[d]+(on?", work day":", day off"));
    b.innerHTML = `<span class="wn">${WD_SHORT[d]}</span><span class="wl">${WD_LET[d]}</span><span class="wdot"></span>`;
    b.onclick = ()=>{
      if(wsSel===d) setWorkDay(d, !on); /* re-tap the selected day = quick toggle */
      else { wsSel = d; renderWorkSched(); }
    };
    strip.appendChild(b);
  });
  $("wDetName").textContent = WD_NAMES[wsSel];
  $("wDetSub").textContent = w.indexOf(wsSel)>=0 ? "Work day" : "Day off";
  $("wDetTgl").classList.toggle("on", w.indexOf(wsSel)>=0);
}

/* 2026.09.27-d: quiet overdue-meal nudge. Mirrors the fatigue model's overdue
   rule (1.5h+ past YOUR learned time for that day type, 5+ observations, meal
   still unlogged) and shows one slim banner at the top of the diary — never a
   popup. Fades out after 4h so it can't nag all evening. */
let nudgeOff = {};
function overdueMeal(){
  const k = todayStr();
  Object.keys(nudgeOff).forEach(x=>{ if(x < k+":") delete nudgeOff[x]; }); /* prune old dismissals */
  const now = new Date(), hr = now.getHours()+now.getMinutes()/60;
  const w = dayType(k)==="work", meals = (S.days[k]&&S.days[k].meals)||{};
  let best = null;
  ["breakfast","lunch","dinner"].forEach(m=>{
    const s = mealTimeStats(m, w);
    if(s.n<5) return;
    if((meals[m]||[]).length>0) return; /* already logged — nothing overdue */
    if(nudgeOff[k+":"+m]) return;
    const late = hr - s.avg/60;
    if(late>=1.5 && late<4 && (!best || late>best.late)) best = {m, late, at:s.avg};
  });
  return best;
}
function dismissNudge(m){ nudgeOff[todayStr()+":"+m] = 1; renderDiary(); }
function renderNudge(isToday){
  const nb = $("nudgeBar");
  if(!nb) return;
  const od = isToday ? overdueMeal() : null;
  if(!od){ nb.classList.remove("show"); nb.innerHTML = ""; return; }
  nb.classList.add("show");
  const label = MEAL_LABEL[od.m];
  nb.innerHTML =
    `<span class="nico"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3.5 2"/></svg></span>`+
    `<span class="ntxt">${label} is overdue<small>You usually eat around ${fmtClock(od.at)}</small></span>`+
    `<button class="nlog" onclick="openSheet('${od.m}')">Log</button>`+
    `<button class="nx" aria-label="Dismiss" onclick="dismissNudge('${od.m}')">×</button>`;
}
/* 2026.09.27-c: extracted so backup-restore can re-run it on pre-split backups.
   Iterates LEARN_MEALS only — 2026.09.27-b crashed here on supplement entries
   because the out literal had no "supplements" key. */
function rebuildMealTimes(){
  const out = {breakfast:[], lunch:[], dinner:[], snacks:[]};
  const nowMs = Date.now(), keys = Object.keys(S.days||{}).sort().slice(-30);
  keys.forEach(k=>{
    const d = S.days[k]; if(!d || !d.meals) return;
    const w = dayType(k)==="work" ? 1 : 0;
    LEARN_MEALS.forEach(m=>{
      const ts = (d.meals[m]||[]).map(e=>e.t).filter(t=>t && t<=nowMs);
      if(ts.length){
        const dt = new Date(Math.min.apply(null, ts));
        out[m].push({t: dt.getHours()*60+dt.getMinutes(), w:w});
        if(out[m].length>30) out[m].shift();
      }
    });
  });
  S.mealTimes = out;
}
function mealTimesNeedRebuild(){
  return LEARN_MEALS.some(m=>((S.mealTimes&&S.mealTimes[m])||[]).some(o=>!o||typeof o!=="object"));
}
/* one-time rebuild: tag learned observations by day type from entry timestamps
   (last 30 days). Legacy untagged numbers were a work/off mix — the exact thing
   Jay flagged as untrustworthy — so they get dropped and each schedule relearns. */
if(!flagGet().mealSplit1){
  rebuildMealTimes();
  if(save()) flagSet("mealSplit1",1); /* don't mark done if the save failed */
}

/* 2026.11.01-b: one-time food fresh start, at Jay's request — every logged food gone.
   Fires only when the state still carries entries from his old baked-in personal
   library (the signature list below). Wipes logged days, custom foods, favorites
   and recipes; profile, goals, weights, bottles and quit streaks are NOT touched. */
if(!flagGet().foodFresh1){
  const PERSONAL_FOODS = ["G&G Organic 85/15 Grass-Fed Ground Beef", "G&G 80/20 Ground Beef", "G&G 90-Second Jasmine Rice", "G&G Boneless Skinless Chicken Breast", "G&G Old Fashioned Oats", "G&G Creamy Almond Butter", "G&G Unsalted Butter", "G&G Extra Virgin Olive Oil", "G&G Clover Honey", "G&G Natural Creamy Peanut Butter", "G&G Whole Milk (Vitamin D)", "Thomas' Plain Bagels", "FAGE BestSelf Lactose Free Plain Greek Yogurt", "Del Monte Cut Green Beans", "Velveeta Shells & Cheese Original", "Mission Carb Balance Soft Taco Tortillas", "ON Creatine Monohydrate (Micronized)", "ON Gold Standard 100% Whey — Double Rich Chocolate", "XTEND Elite Recovery — Watermelon Explosion", "Orgain Organic Protein — Vanilla Bean", "Kirkland Signature Fish Oil 1000 mg", "Kirkland Signature Vitamin D3 50 mcg", "Nature's Bounty Chelated Zinc 50 mg", "G&G Eggs", "Electrolyte Powder", "G&G Banana", "G&G Elbow Macaroni", "Mexican Style Cheese", "Traditional Marinara Sauce", "The Stand Southwest Chicken Wrap", "Progresso Chicken Noodle Soup", "The Stand Classic Burger", "G&G Buttermilk Pancakes"];
  const hasPersonal = (arr)=> (arr||[]).some(f=>f && PERSONAL_FOODS.indexOf(f.n)>=0);
  let sig = hasPersonal(S.customFoods) || (S.favorites||[]).some(n=>PERSONAL_FOODS.indexOf(n)>=0);
  if(!sig){ outer: for(const k in (S.days||{})){ const d=S.days[k]; if(!d||!d.meals) continue; for(const m in d.meals){ if(hasPersonal(d.meals[m])){ sig = true; break outer; } } } }
  if(sig){
    S.days = {}; S.customFoods = []; S.favorites = []; S.recipes = [];
    S.mealTimes = {breakfast:[], lunch:[], dinner:[], snacks:[]};
    save();
  }
  flagSet("foodFresh1",1);
}
/* 2026.11.01-a: the one-time weigh-in history restore was removed — a fresh app
   no longer ships (or injects) any of the owner’s past data. */
/* ============ APP THEME ============ */
/* User-pickable accent color (Settings › Profile › App theme). CSS surfaces read
   var(--acc)/var(--acc-deep)/var(--acc-soft); JS-baked SVG strings use THEME.acc. */
const THEME = { acc:"#5b5bf0" };
function shadeHex(hex, f){
  const n = parseInt(hex.slice(1), 16);
  let r = (n>>16)&255, g = (n>>8)&255, b = n&255;
  const t = f<0?0:255, p = Math.min(1, Math.abs(f));
  r = Math.round((t-r)*p+r); g = Math.round((t-g)*p+g); b = Math.round((t-b)*p+b);
  return "#"+((1<<24)+(r<<16)+(g<<8)+b).toString(16).slice(1);
}
function themeColor(){
  const t = S.profile && S.profile.theme;
  return /^#[0-9a-fA-F]{6}$/.test(t) ? t : "#5b5bf0";
}
function applyTheme(hex){
  hex = /^#[0-9a-fA-F]{6}$/.test(hex) ? hex : "#5b5bf0";
  THEME.acc = hex;
  const rs = document.documentElement.style;
  rs.setProperty("--acc", hex);
  const ar = parseInt(hex.slice(1,3),16), ag = parseInt(hex.slice(3,5),16), ab = parseInt(hex.slice(5,7),16);
  rs.setProperty("--acc-rgb", ar+","+ag+","+ab);
  rs.setProperty("--acc-deep", shadeHex(hex,-0.16));
  rs.setProperty("--acc-soft", shadeHex(hex,0.85));
  const m = document.querySelector('meta[name="theme-color"]');
  if(m) m.setAttribute("content", hex);
}
const THEME_PRESETS = ["#5b5bf0","#6f63f6","#2f8bff","#12cfae","#fb6f84","#ff9f43"];
function renderThemePicker(){
  const row = document.getElementById("themeRow");
  if(!row) return;
  const cur = themeColor().toLowerCase();
  const isPreset = THEME_PRESETS.some(c=>c===cur);
  row.innerHTML = THEME_PRESETS.map(c=>
    `<button type="button" class="themepick${c===cur?" sel":""}" data-c="${c}" style="background:${c}" aria-label="Theme color ${c}"></button>`
  ).join("") +
  `<label class="themepick custom${isPreset?"":" sel"}" aria-label="Custom theme color"><input type="color" id="themeCustom" value="${cur}"></label>`;
  row.querySelectorAll('.themepick[data-c]').forEach(b=>{ b.onclick = ()=>setTheme(b.getAttribute("data-c")); });
  const ci = document.getElementById("themeCustom");
  ci.addEventListener("input", ()=>applyTheme(ci.value));
  ci.addEventListener("change", ()=>setTheme(ci.value));
}
function setTheme(hex){
  if(!S.profile) S.profile = {};
  S.profile.theme = hex;
  applyTheme(hex);
  save();
  renderThemePicker();
  renderAll();
}
/* save() is defined up near KEY — quota-aware, trims oldest progress photos when storage is full */
/* profile fingerprint (state compatibility — kept from the formula era) */
function profHash(){ const p=S.goals.profile; return [p.weightLb,p.heightIn,p.age,p.sex,p.bodyFat,p.activityKey].join("|"); }

if(!S.goals.profHash) S.goals.profHash = profHash();
const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2,7);
const dstr = d => d.getFullYear()+"-"+String(d.getMonth()+1).padStart(2,"0")+"-"+String(d.getDate()).padStart(2,"0");
const todayStr = () => dstr(new Date());
/* ============ PROFILE COMPLETENESS + LIVE AGE (2026.11.25-c) ============
   Nothing is calculated from assumptions: the calorie goal, macros, water and
   nutrient targets all stay blank until the profile has sex, age, height,
   weight and activity. Age is stored with the date it was entered (ageAsOf)
   and counts up a year every year after that, so the formula never runs on a
   frozen age. */
function effAge(p){
  p = p || (S.goals||{}).profile || {};
  const a = +p.age || 0; if(!a) return 0;
  if(!p.ageAsOf) return a;
  const yrs = Math.floor((new Date(todayStr()+"T12:00:00") - new Date(p.ageAsOf+"T12:00:00")) / (365.2425*864e5));
  return a + Math.max(0, yrs);
}
const PROFILE_FIELD_LABEL = {sex:"sex", age:"age", height:"height", weight:"weight", activity:"activity level"};
function profileMissing(){
  const p = (S.goals||{}).profile || {}, miss = [];
  if(!(p.sex==="m" || p.sex==="f" || p.sex==="male" || p.sex==="female")) miss.push("sex");
  const a = effAge(p); if(!(a>=10 && a<=100)) miss.push("age");
  if(!(p.heightIn>0)) miss.push("height");
  if(!(p.weightLb>0)) miss.push("weight");
  if(!p.activityKey) miss.push("activity");
  return miss;
}
function profileReady(){ return profileMissing().length===0; }
function profileMissingText(){ return profileMissing().map(k=>PROFILE_FIELD_LABEL[k]).join(", "); }
/* migrate: an age saved before ageAsOf existed was last confirmed at the last profile save */
if(S.goals && S.goals.profile && S.goals.profile.age>0 && !S.goals.profile.ageAsOf)
  S.goals.profile.ageAsOf = S.goals.profile.updatedAt || todayStr();
let dayOffset = 0;
const viewDate = () => { const d = new Date(); d.setDate(d.getDate()+dayOffset); return dstr(d); };
/* ============ LOCKED DAYS (2026.10.08-f) ============
   "Too lazy to log" days: the day keeps its data, but it is excluded from every
   aggregate — averages, trends, adherence, fatigue/bloat loops — and is a neutral
   skip for streaks (neither extends nor breaks). Stored under its own key so
   fuel.v1 is never touched. */
const LOCK_KEY = "fuel.lockedDays.v1";
let _lkCache = null;
function getLocked(){
  if(_lkCache) return _lkCache;
  try{ const a = JSON.parse(localStorage.getItem(LOCK_KEY)||"[]");
    _lkCache = Array.isArray(a) ? a.filter(x=>typeof x==="string") : [];
  }catch(e){ _lkCache = []; }
  return _lkCache;
}
function isLocked(ds){ return getLocked().indexOf(ds)>=0; }
function setLocked(ds, on){
  const a = getLocked().slice(), i = a.indexOf(ds);
  if(on && i<0) a.push(ds);
  if(!on && i>=0) a.splice(i,1);
  try{ localStorage.setItem(LOCK_KEY, JSON.stringify(a)); }catch(e){}
  _lkCache = a;
}
function emptyDay(){ return {meals:{breakfast:[],lunch:[],dinner:[],snacks:[],supplements:[]}, waterOz:0}; }
function day(){ const k = viewDate(); if(!S.days[k]) S.days[k] = emptyDay(); return S.days[k]; }
/* 2026.09.22-h: day() auto-creates an empty record for any viewed date, so "has data"
   must be explicit — an untouched auto-created day is not a logged day. */
function dayHasData(d){
  if(!d) return false;
  const ms = d.meals||{};
  if(MEALS.some(m=>(ms[m]||[]).length)) return true;
  if((d.waterOz||0)>0) return true;
  const a = d.alc||{};
  if((a.shot||0)+(a.beer||0)+(a.cocktail||0)>0) return true;
  if(d.vape && d.vape!=="none") return true;
  return false;
}
function allFoods(){
  const gone = new Set(S.deletedFoods || []);
  const defs = FOODS.filter(f => !gone.has(f.n));
  const seen = new Set(defs.map(f => f.n));
  return defs.concat((S.customFoods || []).filter(f => !seen.has(f.n)));
}
/* Verified foods: Fuel's own built-in database (served from inside the app —
   no barcode scan, no third-party lookup). His own custom foods always win on name matches. */
function findFood(name){ return allFoods().find(f=>f.n===name) || ((S.deletedFoods||[]).includes(name) ? null : VERIFIED_FOODS.find(f=>f.n===name)); }
/* Location tag (2026.10.13-a): a food's restaurant/store, shown bold in front of its name.
   Stored as f.loc on the food; entries snapshot it, old entries resolve it by name. */
function locPrefixHTML(loc){ return loc ? `<span class="locpfx">${esc(loc)}</span> ` : ""; }
function entryLoc(e){ if(e && e.loc) return e.loc; const f = e && findFood(e.n); return (f && f.loc) || ""; }
function isVerifiedFood(name){ return !isCustom(name) && VERIFIED_FOODS.some(f=>f.n===name); }
/* Entry photos: logged meals don't carry a second copy of the library photo —
   the food library is the source of truth; display resolves it by entry name. */
function entryImg(e){ if(e&&e.img) return e.img; const n=e&&e.n; if(!n) return null;
  const cf=(S.customFoods||[]).find(f=>f.n===n); if(cf&&cf.img) return cf.img;
  const lf=findFood(n); return (lf&&lf.img)||null; }
/* Food badges: 3 dots under the food title — Bulk (green), Lean (blue), Fiber (amber).
   Gray = doesn't qualify. Bulk = energy-dense food that helps hit the surplus
   (protein under 35% of calories). Lean = protein-forward (30%+ of cal from protein,
   fat under 35%). Fiber = 3g+ per serving (supports digestion on a bulk). */
function foodBadges(f){
  var none={bulk:false,lean:false,fiber:false};
  if(!f || !(f.cal>0)) return none;
  var pc=(f.p||0)*4, fc=(f.f||0)*9, cal=f.cal;
  var bulk = pc/cal < 0.35;
  var lean = pc/cal >= 0.30 && fc/cal <= 0.35;
  var fib=0; (f.nutrs||[]).forEach(function(n){ if(/fiber/i.test(n.n||"")) fib += n.amt||0; });
  return {bulk:bulk, lean:lean, fiber:fib>=3};
}
function foodBadgeHTML(f){
  var b = foodBadges(f);
  return '<span class="fbadges" aria-hidden="true">'
    +'<i class="fb'+(b.bulk?' b-bulk':'')+'" title="Bulk-friendly"></i>'
    +'<i class="fb'+(b.lean?' b-lean':'')+'" title="Lean protein"></i>'
    +'<i class="fb'+(b.fiber?' b-fiber':'')+'" title="High fiber"></i></span>';
}
/* ============ FOOD COST (2026.09.22-o) ============
   Foods can carry a store price: pr = whole-package price in $, ps = servings
   per package. Cost per serving = pr/ps, so a $1 jar with 4 servings = $0.25
   each. Logged entries look the food up by name, so prices apply retroactively. */
function foodUnitCost(f){ return (f && f.pr>0 && f.ps>0) ? f.pr/f.ps : 0; }
function entryCost(e){ const f = findFood(e.n); return f ? foodUnitCost(f)*(e.qty||1) : 0; }
function mealCost(items){ return (items||[]).reduce((a,e)=>a+entryCost(e),0); }
function dayCost(d){ return MEALS.reduce((a,m)=>a+mealCost((d.meals||{})[m]||[]),0); }
function fmtCost(v){ return "$"+v.toFixed(2); }
function isFav(name){ return S.favorites.includes(name); }
function isCustom(name){ return S.customFoods.some(f=>f.n===name); }
function toggleFav(name){ const i=S.favorites.indexOf(name); if(i>=0) S.favorites.splice(i,1); else S.favorites.push(name); save(); }
function totals(k){
  const d = S.days[k] || emptyDay();
  const t = {cal:0,p:0,c:0,f:0};
  MEALS.forEach(m => (d.meals[m]||[]).forEach(e=>{ if(!e) return; t.cal+=+e.cal||0; t.p+=+e.p||0; t.c+=+e.c||0; t.f+=+e.f||0; })); /* 2026.10.09-h: NaN guard — one bad entry must not poison a whole day */
  return t;
}
const mealCals = k => { const d = S.days[k] || emptyDay(); const o={}; MEALS.forEach(m=>o[m]=(d.meals[m]||[]).reduce((a,e)=>a+(+e.cal||0),0)); return o; }; /* 2026.10.21-e (audit): same NaN guard totals() has */
const r1 = n => Math.round(n*10)/10;
const tgtTxt = v => v>0 ? r1(v) : "–"; /* 2026.11.25-c: an unset target reads "–", never a fake 0 */
const barW = (v,goal) => (goal>0 ? Math.min(v/goal*100,100) : 0)+"%"; /* never NaN when a goal is 0 */
function esc(s){ return String(s).replace(/[&<>"]/g, c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c])); }
const $ = id => document.getElementById(id);

/* ============ WEEK STRIP ============ */
let weekOff = 0; /* which week the strip shows: 0 = current, -1 = last week, ... */
function renderWeek(){
  const strip = $("weekStrip"); if(!strip) return;
  strip.innerHTML = "";
  const today = new Date(); today.setHours(12,0,0,0);
  const sun = new Date(today); sun.setDate(today.getDate()-today.getDay()+weekOff*7);
  const names = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];
  for(let i=0;i<7;i++){
    const d = new Date(sun); d.setDate(sun.getDate()+i);
    const ks = dstr(d);
    const b = document.createElement("button");
    b.className = "wday"+(ks===viewDate()?" sel":"")+(ks===todayStr()?" istoday":"");
    b.disabled = ks > todayStr();
    const dd = S.days[ks];
    const logged = dd && MEALS.some(m=>(dd.meals[m]||[]).length);
    const dotCls = ks===todayStr() ? "now" : (logged ? "log" : "");
    /* 2026.10.06: red alcohol dot removed — alcohol logging panels were replaced by the
       Streaks panel, so the second dot no longer means anything. One status dot per day. */
    const dotsHtml = '<span class="wdot '+dotCls+'"></span>';
    /* 2026.10.08-f: locked days get the X overlay on the date number */
    const locked = isLocked(ks);
    b.innerHTML = '<span class="wd">'+names[i]+'</span><span class="wn">'+d.getDate()+(locked?'<span class="lk-x" aria-hidden="true"></span>':'')+'</span><span class="wdots" style="'+(dotCls?"":"opacity:0")+'">'+dotsHtml+'</span>';
    b.onclick = ()=>lockTap(b, ks, ()=>{
      const t2 = new Date(); t2.setHours(12,0,0,0);
      const dd2 = new Date(ks+"T12:00:00"); dd2.setHours(12,0,0,0);
      dayOffset = Math.round((dd2-t2)/864e5); renderDiary();
    });
    strip.appendChild(b);
  }
  const tpRow = $("todayPill").closest(".ptodayrow"); if(tpRow) tpRow.style.display = viewDate()===todayStr() ? "none" : "flex";
  $("wkNext").disabled = weekOff >= 0;
}
$("wkPrev").onclick = ()=>{ weekOff--; renderDiary(); };
$("wkNext").onclick = ()=>{ if(weekOff<0){ weekOff++; renderDiary(); } };

/* ============ LOCK DAY (2026.10.08-f/g) ============
   Single tap = view the day (existing behavior). Double-tap = toggle lock
   directly, no sheet. A 300ms timer disambiguates: the second tap inside the
   window cancels the pending single-tap navigation and toggles instead. */
function lockTap(b, ks, onSingle){
  const now = Date.now();
  if(now - (b._lkT||0) < 300){
    clearTimeout(b._lkTO); b._lkT = 0;
    setLocked(ks, !isLocked(ks)); haptic(); renderAll();
  }else{
    b._lkT = now;
    b._lkTO = setTimeout(()=>{ b._lkT = 0; onSingle(); }, 300);
  }
}

/* ============ STATUS / ZONES ============ */
function statusInfo(){
  const k = viewDate(), t = totals(k), g = S.goals;
  const mCal = g.maintenance>0?g.maintenance:0, sAdd = g.surplus>0?g.surplus:0, tCal = mCal+sAdd, eCal = t.cal;
  const defc = Math.round(mCal-eCal), dpct = mCal>0?Math.round(defc/mCal*100):0;
  const pAte = Math.round(t.p||0), pGoal = g.protein||0, lowP = pGoal>0 && pAte < pGoal*0.8;
  let cls,title,det,grad;
  if(mCal<=0){ /* blank slate: no maintenance yet — never claim "on track" on an empty diary */
    cls="unset"; title="Set your goals"; grad="linear-gradient(90deg,#8a8aa3,#b9b9d6)";
    det = "Add your profile in Goals to get a maintenance target — then this bar tracks your zone.";
  }else if(eCal < mCal){
    cls="deficit"; title="Calorie deficit"; grad="linear-gradient(90deg,#ff3b30,#ff8a5c)";
    const tier = defc>=500 ? "deep enough to stall muscle gain" : defc>=250 ? "big enough to slow gains if it keeps up" : "small gap — closable with a snack";
    det = defc.toLocaleString()+" cal under maintenance ("+dpct+"%) — "+tier;
    if(lowP) det += ". Protein only "+pAte+"g of "+pGoal+"g — low protein makes a deficit cost more muscle";
  }else if(eCal < tCal){
    cls="surplus"; title="Past maintenance"; grad="linear-gradient(90deg,#ff9f43,#ffd23d)";
    det = Math.round(tCal-eCal).toLocaleString()+" cal to your daily target";
    if(lowP) det += " · protein "+pAte+"g of "+pGoal+"g";
  }else{
    cls="ontrack"; title="On track"; grad="linear-gradient(90deg,#1faa5c,#66e39a)";
    det = "+"+Math.round(eCal-mCal).toLocaleString()+" over maintenance — gaining zone";
  }
  return {cls,title,det,grad,eCal,mCal,tCal};
}
function renderZoneSheet(){
  const g = S.goals, m = g.maintenance>0?g.maintenance:0, tc = m + (g.surplus>0?g.surplus:0);
  const zrow = (color, icon, name, range, html) =>
    `<div class="zonerow"><span class="zdot" style="background:${color}">${icon}</span><div><b>${name} <span class="zrange">${range}</span></b><p>${html}</p></div></div>`;
  const st = statusInfo();
  $("zoneBody").innerHTML =
    `<div class="zonenow"><b>${st.title}</b><p>${st.det}</p></div>` +
    zrow("#ff5c5c", ICONS.warn, "Deficit", "under "+Math.round(m).toLocaleString()+" cal",
      "Below maintenance. Research: a sustained deficit around 500 cal/day can prevent lean mass gains, and undereating brings fatigue, worse sleep and stalled lifts.") +
    zrow("#ff9f43", ICONS.up, "Building", Math.round(m).toLocaleString()+" – "+Math.round(tc).toLocaleString()+" cal",
      "Past maintenance. You're in surplus territory — close the gap to hit your full gaining target.") +
    zrow("#2fbf71", ICONS.check, "On track", Math.round(tc).toLocaleString()+"+ cal",
      "Daily target hit: maintenance covered plus your full surplus, for growth.") +
    `<div class="zonefoot">Zones come from your goals: ${Math.round(m).toLocaleString()} maintenance + ${Math.round(g.surplus>0?g.surplus:0).toLocaleString()} surplus. The bar fills with the color of your current zone; the tick marks maintenance.<br><br>General nutrition research, not medical advice.</div>`;
}

/* ============ WATER TARGET (research-based, auto) ============ */
function dayHasXW(ds){
  const d = S.days[ds||viewDate()]; if(!d) return false;
  return MEALS.some(m => ((d.meals||{})[m]||[]).some(e=>e.xw));
}
/* ================= ANALYTICS ENGINE — HYDRATION =================
   Research sources (2026 refresh): IOM 2004 — adequate intake ~1.0 mL/kcal total
   water (3.7 L men / 2.7 L women), ~80% from fluids; EFSA 2010 — 2.5 L / 2.0 L.
   No newer AI supersedes these. The "8 glasses" rule has no scientific origin.
   Creatine: ISSN Kreider 2017 — does NOT cause dehydration; no extra water needed
   (the old "+2 glasses on creatine" bump is retired). */
function waterCalc(ds){
  const g = S.goals;
  /* Water is always Auto (2026.10.21-d, Jay) — no manual target anymore. */
  if(!(g.maintenance>0)) return {target:0, manual:false, tdee:0, perKcal:0, xw:dayHasXW(ds), tier:"—", unset:true}; /* blank slate: no phantom fallback */
  const tdee = g.maintenance;
  const pal = actPAL(g.profile);
  const perKcal = pal>=1.7 ? 1.2 : 1.0; /* IOM 1.0-1.5 mL/kcal; 1.2 cap for active tiers */
  const xw = dayHasXW(ds);
  const ml = tdee*perKcal*0.8 + (xw ? 500 : 0); /* ~80% of water from fluids; +500 mL only for a non-creatine supplement manually flagged "needs extra water" */
  const tier = (ACT_TIERS.find(t=>t.key===(g.profile&&g.profile.activityKey))||ACT_TIERS[2]).label;
  return {target:Math.max(4, Math.min(24, Math.round(ml/240))), manual:false, tdee, perKcal, xw, tier};
}
function waterTarget(ds){ return waterCalc(ds).target; }

/* ============ DIARY ============ */
/* Dual concentric rings, Apple-Health style: the big outer ring fills to maintenance,
   then the smaller inner ring starts filling the surplus once the outer is full. */
function ringPaint(eCal, mCal, tCal){
  const C1 = 2*Math.PI*56, C2 = 2*Math.PI*46;
  const mFrac = mCal>0 ? Math.min(eCal/mCal, 1) : 0;
  const maint = $("ringMaint");
  maint.style.strokeDasharray = C1;
  maint.style.strokeDashoffset = C1*(1-mFrac);
  const sGoal = tCal - mCal, track = $("ringSurpTrack"), surp = $("ringSurp");
  if(mCal>0 && sGoal>0){
    track.style.display = ""; surp.style.display = "";
    const sFrac = Math.min(Math.max(eCal-mCal,0)/sGoal, 1);
    surp.style.strokeDasharray = C2;
    surp.style.strokeDashoffset = C2*(1-sFrac);
    surp.style.stroke = eCal >= tCal ? "#2fbf71" : "#d5d5e0"; /* --green: surplus hit = green, never red */
  } else { track.style.display = "none"; surp.style.display = "none"; }
}
/* ============ MEAL-TIME LEARNING ============
   Every food log records minutes-since-midnight per meal (last 30 kept,
   tagged work/off day). That trains the meal-timing insights and gives
   the tired model real meal times instead of fixed guesses. (The Day
   Cycle panel that displayed this was removed 2026.10.15-d.) */
function recordMealTime(meal){
  /* 2026.09.27-c: returns the observation so Undo can retract it */
  if(LEARN_MEALS.indexOf(meal)<0) return null; /* supplements don't learn timing */
  if(!S.mealTimes || !Array.isArray(S.mealTimes[meal])) return null;
  const n = new Date();
  /* 2026.09.27-b: tag each observation with today's type so work days and off
     days learn their own schedules */
  const obs = {t: n.getHours()*60+n.getMinutes(), w: dayType(todayStr())==="work"?1:0};
  S.mealTimes[meal].push(obs);
  if(S.mealTimes[meal].length>30) S.mealTimes[meal].shift();
  return obs;
  /* caller saves right after logging */
}
function unrecordMealTime(meal, obs){
  /* 2026.09.27-c: Undo on a log must also retract its timing observation,
     or log→undo cycles inject phantom windows into the learned schedule */
  if(!obs || !S.mealTimes || !Array.isArray(S.mealTimes[meal])) return;
  const i = S.mealTimes[meal].indexOf(obs);
  if(i>=0) S.mealTimes[meal].splice(i,1);
}
function mealTimeStats(meal, work){
  /* 2026.09.27-b: stats are per day type — pass true for the work-day schedule,
     false for the off-day one. Pass null to blend both day types (calendar
     fallback so bands show on every day). Legacy untagged numbers are ignored. */
  const a = (S.mealTimes && S.mealTimes[meal]) || [];
  const f = work==null
    ? a.filter(o=>o && typeof o==="object" && typeof o.t==="number")
    : a.filter(o=>o && typeof o==="object" && o.w===(work?1:0) && typeof o.t==="number");
  if(!f.length) return {avg:0, n:0};
  /* circular mean: times straddling midnight (23:50 + 0:10) average to ~midnight, not noon */
  let sx=0, sy=0;
  f.forEach(o=>{ const r=o.t/1440*2*Math.PI; sx+=Math.cos(r); sy+=Math.sin(r); });
  let avg = Math.atan2(sy/f.length, sx/f.length)/(2*Math.PI)*1440;
  avg = ((avg%1440)+1440)%1440;
  return {avg, n:f.length};
}
/* today's schedule type, as a boolean for mealTimeStats */
function workToday(){ return dayType(todayStr())==="work"; }
function fmtClock(mins){
  mins = ((Math.round(mins)%1440)+1440)%1440;
  let h = Math.floor(mins/60); const m = mins%60, ap = h>=12?"PM":"AM";
  h = h%12; if(h===0) h=12;
  return h+":"+String(m).padStart(2,"0")+" "+ap;
}
function renderDiary(){
  const k = viewDate(), d = day(), g = S.goals, t = totals(k);
  renderProfileStrip();
  const dt = new Date(k+"T12:00:00");
  const isToday = k === todayStr();
  renderNudge(isToday); /* 2026.09.27-d: quiet overdue-meal banner, today only */
  if(typeof paintAutoZone==="function") paintAutoZone(); /* 2026.09.30-b: autopilot feed + proposals */
  $("dayTitle").textContent = isToday ? "Today" : (dt.getMonth()+1)+"/"+dt.getDate()+"/"+String(dt.getFullYear()).slice(2);
  $("daySub").textContent = dt.toLocaleDateString(undefined,{weekday:"long", month:"short", day:"numeric"});
  $("calEaten").textContent = Math.round(t.cal).toLocaleString();
  const mCal = g.maintenance>0 ? g.maintenance : 0;
  const tCal = mCal + (g.surplus>0 ? g.surplus : 0);
  const left = tCal - t.cal, eCal = t.cal;
  $("progPct").textContent = (tCal>0 ? Math.round(t.cal/tCal*100) : 0)+"%";
  ringPaint(eCal,mCal,tCal);
  $("flagKcal").textContent = left >= 0 ? Math.round(left).toLocaleString()+" kcal" : Math.round(-left).toLocaleString()+" over";
  const fsur = $("flagSur");
  if(eCal > mCal){ fsur.textContent = "+"+Math.round(eCal-mCal).toLocaleString()+" SUR"; fsur.classList.add("on"); }
  else { fsur.textContent = Math.round(mCal-eCal).toLocaleString()+" to SUR"; fsur.classList.remove("on"); }
  const dc = dayCost(d), dcEl = $("dayCost");
  if(dc>0.004){
    dcEl.style.display = "";
    dcEl.textContent = (isToday ? "Today" : dt.toLocaleDateString(undefined,{month:"short", day:"numeric"}))+"'s food · "+fmtCost(dc);
  } else dcEl.style.display = "none";
  const st = statusInfo();
  const fill = $("spFill");
  fill.style.width = (st.tCal>0 ? Math.min(st.eCal/st.tCal,1)*100 : 0)+"%";
  fill.style.background = st.grad;
  $("spMark").style.left = "calc("+(st.tCal>0 ? st.mCal/st.tCal*100 : 0)+"% - 1px)";
  $("barC").style.width = barW(t.c,g.carbs);
  $("barP").style.width = barW(t.p,g.protein);
  $("barF").style.width = barW(t.f,g.fat);
  const fib = fiberTotal(k);
  $("barFi").style.width = barW(fib,fiberTarget()); $("valFig").textContent = tgtTxt(fiberTarget());
  $("valCv").textContent = r1(t.c); $("valCg").textContent = tgtTxt(g.carbs);
  $("valPv").textContent = r1(t.p); $("valPg").textContent = tgtTxt(g.protein);
  $("valFv").textContent = r1(t.f); $("valFg").textContent = tgtTxt(g.fat);
  $("valFiv").textContent = r1(fib);

  const mh = $("meals"); mh.innerHTML = "";
  MEALS.forEach((m,mi) => {
    const items = d.meals[m]||[];
    const mc = items.reduce((a,e)=>a+(+e.cal||0),0); /* 2026.10.21-e (audit): NaN guard, matches totals() */
    const mp = items.reduce((a,e)=>a+(e.p||0),0); /* per-meal protein subtotal (2026.09.24-u) */
    let html = `<div class="mrow${mi===MEALS.length-1 && !items.length ? "" : " noborder"}"><span class="mico" style="background:${MEAL_TINT[m]}">${MEAL_ICON[m]}</span><span class="mname">${MEAL_LABEL[m]}</span><span class="mkcal">${Math.round(mc)} kcal${mp>0.5 ? " · "+Math.round(mp)+"g P" : ""}</span><button class="mcopy" data-copy="${m}" aria-label="Copy ${MEAL_LABEL[m]} from another day">⧉</button><button class="madd" data-add="${m}" aria-label="Add to ${MEAL_LABEL[m]}">+</button></div>`;
    html += items.length ? items.map(e=>{ const im = entryImg(e);
      const eqty = (e.qty==null||isNaN(e.qty)) ? 1 : e.qty; /* 2026.10.09-f: old/seed entries may lack qty/s */
      const eserv = e.s || "1 serving";
      const sub = (e.nutrs && e.nutrs.length)
        ? `${esc(eserv)}${eqty>1?` × ${eqty}`:""} · ${e.nutrs.map(x=>`${r1(x.amt)} ${esc(x.u)}`).join(" + ")}`
        : `${eqty} × ${esc(eserv)}`;
      return `<div class="logrow">${im?`<span class="lthumb"><img src="${im}" alt=""></span>`:""}<span class="nm"><span class="nmt">${locPrefixHTML(entryLoc(e))}${esc(e.n)} <span class="nmsub">${sub}</span></span>${foodBadgeHTML(findFood(e.n)||e)}</span><span class="kc">${Math.round(e.cal)}</span><button class="logdel" data-m="${m}" data-id="${e.id}" aria-label="Remove ${esc(e.n)}">×</button></div>`;
    }).join("") : "";
    const wrap = document.createElement("div");
    wrap.innerHTML = html;
    while(wrap.firstChild) mh.appendChild(wrap.firstChild);
  });
  mh.querySelectorAll("[data-add]").forEach(b=>b.onclick=()=>openSheet(b.dataset.add));
  mh.querySelectorAll("[data-copy]").forEach(b=>b.onclick=()=>openCopySheet(b.dataset.copy));
  mh.querySelectorAll(".logdel").forEach(b=>b.onclick=()=>{
    /* 2026.11.25-a: one tap removes the entry, so it gets an Undo — a mis-tap
       on the small × no longer loses a logged food for good */
    const k = viewDate(), m = b.dataset.m, dd = day(), arr = dd.meals[m] || [];
    const ix = arr.findIndex(e=>e.id===b.dataset.id); if(ix<0) return;
    const gone = arr[ix];
    dd.meals[m] = arr.filter(e=>e.id!==b.dataset.id);
    save(); renderDiary();
    showToast("Removed "+gone.n, "Undo", ()=>{
      const d2 = S.days[k]; if(!d2) return;
      const a2 = d2.meals[m] || (d2.meals[m] = []);
      if(a2.some(e=>e.id===gone.id)) return;
      a2.splice(Math.min(ix, a2.length), 0, gone);
      save(); renderDiary();
    });
  });

  const wtOz = waterTarget(viewDate())*8; /* target in oz; 0 = unset, logging still works */
  const oz = Math.round((d.waterOz||0)*10)/10;
  $("waterLabel").textContent = wtOz>0 ? oz+" / "+wtOz+" oz" : oz+" oz";
  $("waterFill").style.width = (wtOz>0 ? Math.min(oz/wtOz,1)*100 : 0)+"%";
  const br = $("bottleRow"); br.innerHTML = "";
  (S.bottles||[]).forEach(b=>{
    const btn = document.createElement("button");
    btn.className = "bottle";
    btn.innerHTML = b.img
      ? '<img src="'+b.img+'" alt=""><span>'+esc(b.name)+" · "+b.oz+' oz</span>'
      : "<b>+"+b.oz+" oz</b><span>"+esc(b.name)+"</span>";
    btn.title = b.name+" — "+b.oz+" oz";
    btn.onclick = ()=>{ const dd=day(); dd.waterOz=Math.round(((dd.waterOz||0)+b.oz)*10)/10; (dd.waterHist=dd.waterHist||[]).push(b.oz); save(); renderDiary(); };
    br.appendChild(btn);
  });
  const un = $("waterUndo"), hist = d.waterHist||[];
  un.style.display = hist.length ? "" : "none";
  un.onclick = ()=>{ const dd=day(), h=dd.waterHist||[]; if(h.length){ const last=h.pop(); dd.waterOz=Math.max(0,Math.round(((dd.waterOz||0)-last)*10)/10); save(); renderDiary(); } };
  $("bottleMgr").onclick = openBottleSheet;
  const wn = $("waterNote");
  const wt = (!(S.goals.water>0) && !(wtOz>0)) ? "No water target yet — add your stats in Calorie Goal › Your stats and it sets itself automatically." : ""; /* 2026.10.21-e: water is always Auto now; the old text pointed at a removed manual control */
  wn.textContent = wt; wn.style.display = wt ? "" : "none"; /* explainer lives in the ⓘ sheet */
  /* close-day button: today only, reflects closed state */
  const cdb = $("closeDayBtn");
  if(viewDate()===todayStr()){
    cdb.style.display = "";
    const closed = !!d.closed;
    cdb.textContent = closed ? "Day closed ✓ · tap to review" : "Close day →";
    cdb.classList.toggle("done", closed);
  } else cdb.style.display = "none";
  renderStreaks();
  renderWeek();
  paintEnergy();
  paintScoreWheel();
}

/* ============ ENERGY CHECK-IN (2026.09.24-e) ============
   One-tap daily energy rating (1-5). This is the only logged energy series, so
   next-day energy correlations run on it — never on the computed tired model. */
function paintEnergy(){
  const box = document.getElementById("energyDots");
  if(!box) return;
  const d = day(), v = d.energy||0;
  box.innerHTML = "";
  const labels = ["","Wrecked","Low","Okay","Good","Locked in"];
  for(let i=1;i<=5;i++){
    const b = document.createElement("button");
    b.className = "edot"+(i<=v?" on":"");
    b.textContent = i;
    b.setAttribute("aria-label","Energy "+i+" of 5");
    b.onclick = ()=>{ const dd=day(); dd.energy = (dd.energy===i?0:i); save(); paintEnergy(); };
    box.appendChild(b);
  }
  document.getElementById("energyLabel").textContent = v ? labels[v] : "Not logged";
}

/* ============ ALCOHOL (research #10) ============ */
/* ============ ALCOHOL (research #10, refreshed 2026-09-18) ============
   Log by drink type — shots, beer, cocktails — since a shot and a beer are very
   different drinks. NIAAA: 1 standard drink = 14 g alcohol; 1.5 oz 80-proof shot
   = 1 std drink ≈ 97 kcal; 12 oz 5% beer = 1 std drink ≈ 150 kcal; typical mixed
   cocktail ≈ 1.5 std drinks ≈ 200 kcal. BAC via Widmark, scaled to his weight:
   at 120 lb, 2 shots ≈ the 0.08% driving limit. Parr et al. 2014: ~1.5 g/kg
   (≈6 shots at his weight) cut muscle protein synthesis 24–37%; 1–2 drinks unstudied.
   Shots spike BAC faster than sipped beer. */
const ALC_INFO = {
  shot:     {kcal:97,  std:1,   label:"Shots",     sub:"1.5 oz · 80-proof · ≈97 kcal"},
  beer:     {kcal:150, std:1,   label:"Beers",     sub:"12 oz · 5% · ≈150 kcal"},
  cocktail: {kcal:200, std:1.5, label:"Cocktails", sub:"mixed · ≈1.5 drinks · ≈200 kcal"}
};
function alcData(d){
  let a = d.alc;
  if(typeof a === "number") a = {shot:0, beer:a, cocktail:0}; /* migrate old count */
  a = Object.assign({shot:0, beer:0, cocktail:0}, a||{});
  const std = a.shot*1 + a.beer*1 + a.cocktail*1.5;
  const kcal = a.shot*97 + a.beer*150 + a.cocktail*200;
  return {a, std, kcal};
}
/* ============ STREAKS (2026.10.06-c): days-since-last-use counters.
   Tap a circle -> calendar sheet to set the LAST DAY you vaped/drank; the count is full days
   since that date (exclusive), computed from the real calendar. Color phase per research-grounded
   thresholds (see streakPhase). Stored additively under S.streaks[key].lastUse ("YYYY-MM-DD" or null).
   Migrates the 2026.10.06-a/b {start, checkins} shape: start was the last-use day, carried over. */
function streaks(){ if(!S.streaks) S.streaks = {}; return S.streaks; }
function streakGet(key){
  const st = streaks();
  let s = st[key];
  if(!s || typeof s !== "object") s = st[key] = { lastUse:null };
  if(s.lastUse === undefined){
    s.lastUse = s.start || null; /* old shape: start was the last-use day */
    delete s.start; delete s.checkins;
  }
  return s;
}
function parseYMD(ymd){ const p = ymd.split("-"); return new Date(+p[0], +p[1]-1, +p[2]); }
/* full days since last use (exclusive): used yesterday -> 1 */
function streakDays(key){
  const s = streakGet(key);
  if(!s.lastUse) return 0;
  const a = parseYMD(s.lastUse), n = new Date();
  const d0 = new Date(a.getFullYear(),a.getMonth(),a.getDate());
  const d1 = new Date(n.getFullYear(),n.getMonth(),n.getDate());
  return Math.max(0, Math.round((d1-d0)/864e5));
}
/* Research-grounded phases (2026.10.06-b research):
   NICOTINE red 0-3: peak withdrawal, nicotine out ~72h, cravings worst day 2-3 (Cleveland Clinic; NCI).
     orange 4-14: symptoms fade over 1-2 weeks, cravings pass in minutes. yellow 15-30: rewiring.
     green 31+: cravings rare/brief, sleep like a never-smoker.
   ALCOHOL red 0-1: hangover clearing, rehydrating. orange 2-7: sleep resets (REM rebound), digestion
     settles. yellow 8-30: sleep/liver/skin/energy repair. green 31+: clear mornings are baseline. */
function streakPhase(key, days, started){
  if(!started || days<0) return "none";
  const lim = key==="nicotine" ? [3,14,30] : [1,7,30];
  if(days<=lim[0]) return "red";
  if(days<=lim[1]) return "orange";
  if(days<=lim[2]) return "yellow";
  return "green";
}
const PHASE_COLOR = {red:"#ef4444", orange:"#f97316", yellow:"#ca8a04", green:"#16a34a"};
const PHASE_NAME = {
  nicotine:{red:"Peak withdrawal", orange:"Easing off", yellow:"Rewiring", green:"New normal"},
  alcohol:{red:"Clearing out", orange:"Recalibrating", yellow:"Repairing", green:"Thriving"}
};
function streakSlip(key){
  streakGet(key).lastUse = todayStr();
  save(); renderStreaks(); closeInfoSheet();
}
/* streak progress ring (2026.10.09-f): ring fills toward 30 days clean (fill = min(days/30,1));
   color lerps smoothly through the quit tracker's phase colors as the ring grows. */
const SC_R = 28, SC_CIRC = 2*Math.PI*SC_R;
function scHexRGB(h){ h=h.replace("#",""); return [parseInt(h.slice(0,2),16),parseInt(h.slice(2,4),16),parseInt(h.slice(4,6),16)]; }
function scLerpColor(stops, t){
  t=Math.max(0,Math.min(1,t));
  if(!stops.length) return "#d7d7de";
  if(stops.length===1) return stops[0];
  const x=t*(stops.length-1), i=Math.min(stops.length-2,Math.floor(x)), f=x-i;
  const a=scHexRGB(stops[i]), b=scHexRGB(stops[i+1]);
  const m=a.map(function(v,k){ return Math.round(v+(b[k]-v)*f); });
  return "#"+m.map(function(v){ return v.toString(16).padStart(2,"0"); }).join("");
}
function scPaintRing(key, days, started){
  const ring=document.getElementById(key==="nicotine" ? "nicRing" : "alcRing");
  if(!ring) return;
  const frac = started ? Math.min(days/30, 1) : 0;
  /* phase colors mirror the quit tracker's QT_NIC/QT_ALC arrays (declared in a later
     script block, so literals here keep first paint correct) */
  const stops = key==="nicotine"
    ? ["#ef4444","#f97316","#eab308","#3b82f6","#22c55e"]
    : ["#14b8a6","#10b981","#15803d"];
  ring.style.strokeDasharray = SC_CIRC.toFixed(2);
  ring.style.strokeDashoffset = (SC_CIRC*(1-frac)).toFixed(2);
  ring.style.stroke = started ? scLerpColor(stops, frac) : "#d7d7de";
}
/* organ healing satellites (2026.10.09-f): milestone-weighted progress toward full healing.
   Lungs: 100% = 90 days (lung function substantially recovered, cilia restored). Liver: 100% = 90 days (social drinker). */
const OH_LUNGS=[[12,10],[72,20],[336,40],[720,60],[1008,75],[1440,88],[2160,100]]; /* [hours,pct] */
const OH_LIVER=[[1,10],[7,25],[14,45],[30,65],[42,80],[90,100]]; /* [days,pct] */
const OH_STOPS=["#fca5a5","#dc2626","#15803d","#86efac"]; /* light red -> dark red -> dark green -> light green */
const OH_R=15.5, OH_CIRC=2*Math.PI*OH_R;
function ohProgress(miles,x){
  if(!(x>0)) return 0;
  var px=0, pp=0;
  for(var i=0;i<miles.length;i++){
    if(x<=miles[i][0]){ var f=(x-px)/(miles[i][0]-px); return pp+(miles[i][1]-pp)*f; }
    px=miles[i][0]; pp=miles[i][1];
  }
  return 100;
}
/* quit start in ms — canonical resolver shared by the big streak ring and the
   organ-healing satellites (2026.10.09-f): prefer the Timeline view's stored
   start (fuel.quit.<key>.v1); fall back to the diary streak calendar's last-use
   with the Timeline view's seed rule (QT_DEF seedTime — literal here because
   this block runs before the quit-tracker block declares QT_DEF). */
function ohStartMs(key){
  try{
    var v=JSON.parse(localStorage.getItem("fuel.quit."+key+".v1"));
    if(v&&v.start){ var t=new Date(v.start).getTime(); if(!isNaN(t)) return t; }
  }catch(e){}
  try{
    var lu=streakGet(key).lastUse;
    if(lu){ var t2=new Date(lu+(key==="nicotine"?"T14:00:00":"T00:00:00")).getTime(); if(!isNaN(t2)) return t2; }
  }catch(e){}
  return null;
}
function ohPaint(key){
  var isNic=key==="nicotine";
  var t0=ohStartMs(key);
  var x=t0==null?null:((Date.now()-t0)/36e5)/(isNic?1:24);
  var pct=x==null?0:ohProgress(isNic?OH_LUNGS:OH_LIVER,x);
  var ring=document.getElementById(isNic?"nicHealRing":"alcHealRing");
  var lbl=document.getElementById(isNic?"nicHealPct":"alcHealPct");
  if(ring){
    ring.style.strokeDasharray=OH_CIRC.toFixed(2);
    ring.style.strokeDashoffset=(OH_CIRC*(1-pct/100)).toFixed(2);
    ring.style.stroke=x==null?"#d7d7de":scLerpColor(OH_STOPS,pct/100);
  }
  if(lbl) lbl.textContent=Math.round(pct)+"%";
}
function renderStreaks(){
  if(!document.getElementById("nicTap")) return; /* diary card removed 2026.10.11-e; profile has its own painter */
  [["nicotine","nicDays","nicNum","nicTap","nicPhase"],["alcohol","alcDays","alcNum","alcTap","alcPhase"]].forEach(function(c){
    const key=c[0], s=streakGet(key), days=streakDays(key), started=!!s.lastUse;
    $(c[1]).textContent = !started ? "tap the circle to set your last day"
      : (days===0 ? "fresh start · day 0" : (days+" day"+(days===1?"":"s")+" clean"));
    $(c[2]).textContent = days;
    const btn=$(c[3]), ph=streakPhase(key,days,started);
    btn.classList.remove("ph-red","ph-orange","ph-yellow","ph-green");
    if(ph!=="none") btn.classList.add("ph-"+ph);
    scPaintRing(key, days, started);
    ohPaint(key);
    const pl=$(c[4]);
    if(!started){ pl.textContent=""; }
    else { pl.textContent=PHASE_NAME[key][ph]; pl.style.color=PHASE_COLOR[ph]; }
  });
}
/* ---- date picker sheet ---- */
let calKey=null, calSel=null;
let calView = new Date(); calView = new Date(calView.getFullYear(), calView.getMonth(), 1);
const MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];
function openCal(key){
  calKey = key;
  calSel = streakGet(key).lastUse || todayStr();
  const d = parseYMD(calSel);
  calView = new Date(d.getFullYear(), d.getMonth(), 1);
  document.getElementById("calSheetTitle").textContent = key==="nicotine" ? "Last day you vaped" : "Last day you drank";
  paintCal();
  document.getElementById("calSheet").classList.add("open");
}
function closeCal(){ document.getElementById("calSheet").classList.remove("open"); calKey=null; }
function paintCal(){
  const y = calView.getFullYear(), m = calView.getMonth();
  document.getElementById("calTitle").textContent = MONTHS[m] + " " + y;
  const now = new Date(), tY=now.getFullYear(), tM=now.getMonth(), tD=now.getDate();
  const first = new Date(y, m, 1).getDay();
  const dim = new Date(y, m+1, 0).getDate();
  let h = "";
  ["S","M","T","W","T","F","S"].forEach(function(wd){ h += '<span class="calwd">'+wd+'</span>'; });
  for(let i=0;i<first;i++) h += "<span></span>";
  for(let dd=1; dd<=dim; dd++){
    const isFuture = (y>tY) || (y===tY && m>tM) || (y===tY && m===tM && dd>tD);
    const ds = y+"-"+String(m+1).padStart(2,"0")+"-"+String(dd).padStart(2,"0");
    const cls = "calday"+(isFuture?" dis":"")+(ds===calSel?" sel":"")+(!isFuture&&y===tY&&m===tM&&dd===tD?" today":"");
    h += isFuture
      ? '<span class="'+cls+'">'+dd+"</span>"
      : '<button class="'+cls+'" data-d="'+ds+'" aria-label="'+ds+'">'+dd+"</button>";
  }
  document.getElementById("calGrid").innerHTML = h;
  document.getElementById("calNext").classList.toggle("dis", y===tY && m===tM);
}
document.getElementById("calGrid").addEventListener("click", function(e){
  const b = e.target.closest("button.calday"); if(!b) return;
  calSel = b.getAttribute("data-d");
  paintCal();
});
document.getElementById("calPrev").onclick = function(){ calView = new Date(calView.getFullYear(), calView.getMonth()-1, 1); paintCal(); };
document.getElementById("calNext").onclick = function(){
  const n = new Date(), cap = new Date(n.getFullYear(), n.getMonth(), 1);
  const v = new Date(calView.getFullYear(), calView.getMonth()+1, 1);
  if(v <= cap){ calView = v; paintCal(); }
};
document.getElementById("calCancel").onclick = closeCal;
document.getElementById("calScrim").onclick = closeCal;
document.getElementById("calSet").onclick = function(){
  if(!calKey || !calSel) return;
  streakGet(calKey).lastUse = calSel;
  /* 2026.10.11-e: keep the Quit Timeline on the same date — one source of truth */
  try{ qtSet(calKey, {start:calSel + QT_DEF[calKey].seedTime}); }catch(e){}
  save(); renderStreaks(); paintPfStreaks(); closeCal();
};
/* slip buttons live inside the streak info sheet */
(function(){
  const ib = document.getElementById("infoBody");
  if(ib) ib.addEventListener("click", function(e){
    const b = e.target.closest("[data-slip]");
    if(b) streakSlip(b.getAttribute("data-slip"));
  });
})();

/* ============ COPY MEAL ============ */
function openCopySheet(meal){
  document.getElementById("copyTitle").textContent = "Copy "+MEAL_LABEL[meal];
  const body = document.getElementById("copyBody");
  const opts = [];
  for(let i=1;i<=14;i++){
    const k = addDays(viewDate(), -i);
    const dd = S.days[k];
    const items = dd && dd.meals && dd.meals[meal];
    if(items && items.length) opts.push({k, items});
  }
  body.innerHTML = opts.length ? opts.map(o=>{
    const kc = Math.round(o.items.reduce((a,e)=>a+e.cal,0));
    const pr = Math.round(o.items.reduce((a,e)=>a+(e.p||0),0));
    const lbl = new Date(o.k+"T12:00:00").toLocaleDateString(undefined,{weekday:"short", month:"short", day:"numeric"});
    return `<button class="copyrow" data-k="${o.k}"><span><span class="cd">${lbl}</span><br><span class="cs">${o.items.length} item${o.items.length>1?"s":""}${pr>0?" · "+pr+"g protein":""}</span></span><span class="ck">${kc} kcal</span></button>`;
  }).join("") : `<div class="rangenote">Nothing logged for ${MEAL_LABEL[meal].toLowerCase()} in the last 2 weeks.</div>`;
  body.querySelectorAll(".copyrow").forEach(b=>b.onclick=()=>{
    const src = (S.days[b.dataset.k].meals||{})[meal]||[];
    const dd = day();
    if(!dd.meals[meal]) dd.meals[meal] = [];
    src.forEach(e=>{ const ne={...e, id:"e"+Date.now()+Math.random().toString(36).slice(2,8)};
      if(dayOffset===0) ne.t = Date.now(); else delete ne.t; /* fresh stamp when copying into today; backdated copies stay untimed so the tired model and go-tos don't read stale hours (2026.09.24-x) */
      dd.meals[meal].push(ne); });
    /* no recordMealTime here (2026.09.23-k): backfilling old days must not stamp "now" as his usual eat time */
    save(); renderDiary(); closeCopySheet();
  });
  document.getElementById("copySheet").classList.add("open");
}
function closeCopySheet(){ document.getElementById("copySheet").classList.remove("open"); }
document.getElementById("copyX").onclick = closeCopySheet;
document.getElementById("copyScrim").onclick = closeCopySheet;

/* ============ CLOSE DAY (2026.09.24-u): day-closeout ritual ============
   One-sentence week highlight + calories/protein compliance + 5-week pace
   projection at today's intake. A day counts via the two numbers that matter. */
function openCloseSheet(){
  const k = viewDate(), d = day(), t = totals(k), g = S.goals;
  const mCal = g.maintenance>0 ? g.maintenance : 0;
  const tCal = mCal + (g.surplus>0 ? g.surplus : 0);
  const pT = g.protein||0;
  document.getElementById("closeTitle").textContent = d.closed ? "Day review" : "Close day";
  /* one-sentence highlight: average over up to the last 7 logged days vs target */
  let sum = 0, n = 0;
  for(let i=0;i<45 && n<7;i++){
    const kk = addDays(k, -i), dd = S.days[kk];
    if(dd && MEALS.some(m=>(dd.meals[m]||[]).length)){ sum += totals(kk).cal; n++; }
  }
  let hi, avg = 0;
  if(n>=2 && tCal>0){
    avg = Math.round(sum/n);
    const diff = avg - Math.round(tCal);
    hi = "Averaging <b>"+avg.toLocaleString()+" kcal</b> over your last "+n+" logged days — "+
      (diff===0 ? "right on" : diff>0 ? "<b>"+diff.toLocaleString()+" over</b>" : "<b>"+(-diff).toLocaleString()+" under</b>")+
      " your "+Math.round(tCal).toLocaleString()+" target.";
  } else hi = "Log a few more days and this space will read your week back to you.";
  const stat = (v,tg)=> v>=tg ? ["Met","met"] : v>=tg*0.9 ? ["Close","close"] : ["Short",""];
  const cs = tCal>0 ? stat(t.cal, tCal) : ["—",""];
  const ps = pT>0 ? stat(t.p, pT) : ["—",""];
  /* 5-week pace: your measured weight trend first, else your recent eating average.
     Never today's partial log — an empty morning once projected −25 lb. */
  let proj = "";
  const ad = g.adaptive;
  if(ad && ad.ok && !ad.stale && typeof ad.rateWk === "number"){
    const lb5 = ad.rateWk*5, sgn = lb5>=0 ? "+" : "−";
    const disp = Math.abs(lb5) < 0.05 ? "~0" : sgn+Math.abs(r1(lb5));
    proj = '<div class="closerow"><span>5-week pace (your trend)</span><b>'+disp+' lb</b></div>'+
      '<div class="rangenote">From your actual weigh-ins — you\'re running '+sgn+Math.abs(r1(ad.rateWk))+' lb/week lately.</div>';
  } else if(mCal>0 && n>=2){
    const sur = Math.round(avg - mCal), lb5 = sur*35/3500, sgn = sur>=0 ? "+" : "−";
    proj = '<div class="closerow"><span>5-week pace (recent eating)</span><b>'+sgn+Math.abs(r1(lb5))+' lb</b></div>'+
      '<div class="rangenote">If every day looked like your recent average ('+sgn+Math.abs(sur).toLocaleString()+' vs maintenance), that\'s about '+sgn+Math.abs(r1(lb5))+' lb in 5 weeks.</div>';
  }
  document.getElementById("closeBody").innerHTML =
    '<div class="closehi">'+hi+'</div>'+
    (tCal>0 ? '<div class="closerow"><span>Calories</span><b>'+Math.round(t.cal).toLocaleString()+' / '+Math.round(tCal).toLocaleString()+'</b><span class="cstat '+cs[1]+'">'+cs[0]+'</span></div>' : "")+
    (pT>0 ? '<div class="closerow"><span>Protein</span><b>'+Math.round(t.p)+' / '+Math.round(pT)+'g</b><span class="cstat '+ps[1]+'">'+ps[0]+'</span></div>' : "")+
    proj+
    '<button class="bigbtn" id="closeConfirm" style="margin-top:12px">'+(d.closed ? "Reopen day" : "Close day")+'</button>';
  document.getElementById("closeConfirm").onclick = ()=>{
    const dd = day();
    const was = !!dd.closed;
    if(was) delete dd.closed; else dd.closed = Date.now();
    save(); renderDiary(); closeCloseSheet();
    showToast(was ? "Day reopened" : "Day closed — nice work");
  };
  document.getElementById("closeSheet").classList.add("open");
  paintSigned(document.getElementById("closeSheet"));
}
function closeCloseSheet(){ document.getElementById("closeSheet").classList.remove("open"); }
document.getElementById("closeX").onclick = closeCloseSheet;
document.getElementById("closeScrim").onclick = closeCloseSheet;
document.getElementById("closeDayBtn").onclick = ()=>{ if(viewDate()===todayStr()) openCloseSheet(); };

/* ============ WATER BOTTLES ============ */
/* Bottles are user-defined: name + size, logged with one tap. Intake is stored
   in fluid oz (d.waterOz); the target stays in glasses internally and is shown
   as oz (×8) so bottles and target speak the same unit. */
const OZ_PER_ML = 0.033814;
/* Shared photo downscale: file -> small JPEG dataURL (keeps localStorage small) */
function downscalePhoto(file, max, cb){
  const url = URL.createObjectURL(file);
  const img = new Image();
  img.onload = ()=>{
    const scale = Math.min(1, max/Math.max(img.width, img.height));
    const cv = document.createElement("canvas");
    cv.width = Math.max(1, Math.round(img.width*scale)); cv.height = Math.max(1, Math.round(img.height*scale));
    cv.getContext("2d").drawImage(img, 0, 0, cv.width, cv.height);
    URL.revokeObjectURL(url);
    cb(cv.toDataURL("image/jpeg", 0.8));
  };
  img.onerror = ()=>{ URL.revokeObjectURL(url); alert("Couldn't read that photo."); };
  img.src = url;
}
const CAM_SVG = '<svg viewBox="0 0 24 24" fill="none" style="stroke:var(--acc)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 8h3l2-2.5h6L17 8h3a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9a1 1 0 0 1 1-1z"/><circle cx="12" cy="13.5" r="3.2"/></svg>';
function openBottleSheet(){
  const body = document.getElementById("bottleBody");
  const list = (S.bottles||[]).map(b=>
    `<div class="botrow">${b.img?`<img class="bthumb" src="${b.img}" alt="">`:`<span class="bthumb"></span>`}<span class="bnm"><b>${esc(b.name)}</b><span>${b.oz} oz · ${Math.round(b.oz/OZ_PER_ML)} mL</span></span><button class="bphoto${b.img?" hasimg":""}" data-id="${b.id}" aria-label="Set bottle photo">${CAM_SVG}</button><button class="botdel" data-id="${b.id}" aria-label="Delete bottle">×</button></div>`
  ).join("");
  let bPhoto = "";
  body.innerHTML =
    `<div class="fhead"><span class="flabel">Quick add</span></div>
     <div class="botform"><input id="qOz" type="number" inputmode="decimal" placeholder="oz" style="width:90px"><button class="chip" id="qAdd">Log</button></div>
     <div class="fhead" style="margin-top:14px"><span class="flabel">My bottles</span></div>
     ${list||'<div class="rangenote">No bottles yet.</div>'}
     <div class="fhead" style="margin-top:14px"><span class="flabel">Add a bottle</span></div>
     <div class="botform"><button class="bphoto" id="bPhotoBtn" aria-label="Add bottle photo" style="width:44px;height:44px">${CAM_SVG}</button><img class="bimgprev" id="bImgPrev" style="display:none" alt=""><input type="file" id="bPhotoFile" accept="image/*" style="display:none"><input id="bName" placeholder="Name (e.g. Gym bottle)" style="flex:1;min-width:120px"><input id="bSize" type="number" inputmode="decimal" placeholder="Size" style="width:80px">
     <span class="unitseg" id="bUnit"><button data-u="oz" class="sel">oz</button><button data-u="ml">mL</button></span>
     <button class="chip" id="bAdd">Add</button></div>`;
  let unit = "oz";
  body.querySelectorAll("#bUnit button").forEach(x=>x.onclick=()=>{ unit=x.dataset.u; body.querySelectorAll("#bUnit button").forEach(y=>y.classList.toggle("sel",y===x)); });
  body.querySelector("#qAdd").onclick = ()=>{
    const v = parseFloat(body.querySelector("#qOz").value);
    if(!(v>0)) return;
    const dd = day(); dd.waterOz=Math.round(((dd.waterOz||0)+v)*10)/10; (dd.waterHist=dd.waterHist||[]).push(v);
    save(); renderDiary(); closeBottleSheet();
  };
  body.querySelector("#bPhotoBtn").onclick = ()=>body.querySelector("#bPhotoFile").click();
  body.querySelector("#bPhotoFile").onchange = e=>{
    const file = e.target.files[0]; if(!file) return;
    downscalePhoto(file, 160, url=>{ bPhoto = url;
      const prev = body.querySelector("#bImgPrev"); prev.src = url; prev.style.display = "";
      body.querySelector("#bPhotoBtn").classList.add("hasimg");
    });
  };
  body.querySelector("#bAdd").onclick = ()=>{
    const nm = body.querySelector("#bName").value.trim()||"Bottle";
    const sz = parseFloat(body.querySelector("#bSize").value);
    if(!(sz>0)) return;
    const oz = unit==="ml" ? Math.round(sz*OZ_PER_ML*10)/10 : Math.round(sz*10)/10;
    S.bottles.push({id:"b"+Date.now(), name:nm, oz, img:bPhoto||""});
    save(); openBottleSheet(); renderDiary();
  };
  body.querySelectorAll(".bphoto[data-id]").forEach(x=>x.onclick=()=>{
    const inp = document.createElement("input");
    inp.type = "file"; inp.accept = "image/*";
    inp.onchange = ()=>{
      const file = inp.files[0]; if(!file) return;
      downscalePhoto(file, 160, url=>{
        const b = (S.bottles||[]).find(b=>b.id===x.dataset.id);
        if(b){ b.img = url; save(); openBottleSheet(); renderDiary(); }
      });
    };
    inp.click();
  });
  body.querySelectorAll(".botdel").forEach(x=>x.onclick=()=>{
    if(!confirm("Delete this bottle?")) return;
    S.bottles = S.bottles.filter(b=>b.id!==x.dataset.id);
    if(!S.bottles.length) S.bottles=[{id:"b"+Date.now(),name:"Glass",oz:8}];
    save(); openBottleSheet(); renderDiary();
  });
  document.getElementById("bottleSheet").classList.add("open");
}
function closeBottleSheet(){ document.getElementById("bottleSheet").classList.remove("open"); }
document.getElementById("bottleX").onclick = closeBottleSheet;
document.getElementById("bottleScrim").onclick = closeBottleSheet;

/* ============ ADHERENCE + FATIGUE SCORES ============ */
/* Adherence: % of logged days (last 14) hitting calories within ±10% of goal and
   protein ≥90%. Self-monitoring adherence is the strongest predictor of nutrition
   outcomes — stronger than the specific diet (Burke et al., J Am Diet Assoc 2011). */
function adherenceStats(){
  const goal = goalTotal(), pt = S.goals.protein;
  /* thin reducer over the analytics-engine series — same two hit tests as always */
  const food = adherenceSeries(14).filter(x=>x.foodLogged);
  const hit = food.filter(x=>x.hit).length;
  /* no goals set yet -> no basis for a percentage; the wheel shows "\u2013" */
  const noGoal = !(goal>0 && pt>0);
  return {n: food.length, hit, pct: (food.length>0 && !noGoal) ? Math.round(hit/food.length*100) : null};
}
/* ============ FOOD FATIGUE + BLOAT — "how will I feel" predictions ============
   Both are predictions from what was LOGGED today (meals, water, alcohol) — the
   old training-load fatigue model was retired in 2026.09.18-az.
   FOOD FATIGUE 0-100 (higher = more drained):
   - Glycemic crash: glucose spikes silence orexin/hypocretin wakefulness neurons
     (Burdakov et al., J Neurosci 2005; Neuron 2006); amino acids blunt the effect
     (Karnani et al. 2011). Carb-heavy + protein-light meals hit hardest.
   - Serotonin tilt: carb-rich, protein-poor meals raise brain tryptophan/serotonin
     (Wurtman, MIT) — weighted lightly, since it needs very little protein to show.
   - Meal size: big meals trigger postprandial "rest and digest" sleepiness.
   - Hydration: ~1.5% dehydration brings fatigue and mood dips (Ganio et al. 2011,
     men; Armstrong et al. 2012, women).
   - Under-fueling: low energy availability drains energy (RED-S / Mountjoy et al.).
   - Alcohol: fragments sleep architecture (Parr et al. 2014) — the drag lands next day.
   BLOAT 0-100 (higher = more bloated):
   - Sodium: high-sodium diets raised bloating risk 27%; potassium helps excrete
     sodium (Peng et al., Am J Gastroenterol 2019 — DASH-Sodium re-analysis).
   - Fiber spike: high-fiber diets raised bloating risk 41% — gut bacteria ferment
     sudden extra fiber into gas (same trial).
   - Sugars, big/fatty meals (slow stomach emptying), low water, alcohol. */
function mealMacros(ds){
  const d = S.days[ds] || {meals:{}};
  const out = {};
  MEALS.forEach(m=>{
    const t = {cal:0,p:0,c:0,f:0,fiber:0,sugars:0,sodium:0,pot:0};
    (d.meals[m]||[]).forEach(e=>{
      t.cal+=e.cal||0; t.p+=e.p||0; t.c+=e.c||0; t.f+=e.f||0;
      (e.nutrs||[]).forEach(x=>{
        const n = canonNutr(x.n), u = String(x.u||"").toLowerCase();
        const mg = u==="g" ? x.amt*1000 : u==="mcg" ? x.amt/1000 : x.amt;
        if(n==="Fiber") t.fiber += mg/1000;
        else if(n==="Sugars"||n==="Added Sugars") t.sugars += mg/1000;
        else if(n==="Sodium") t.sodium += mg;
        else if(n==="Potassium") t.pot += mg;
      });
    });
    out[m]=t;
  });
  return out;
}
/* ============ TIRED LEVEL — "how tired do you feel" estimate ============
   Rebuilt 2026.09.23-a (research pass): the workout input is gone. This app has
   no training logging, so a dead input was pretending to move the number. The
   model is now food data + time of day only, per the evidence:
   - Base 30 (neutral), clamped 0-100, mapped to 5 levels:
     1 Wired / 2 Up / 3 Even / 4 Drowsy / 5 Drained. No % number on the chip.
   - MISSING DATA DEFAULTS TO FINE, never to tired. Sleep debt is the dominant
     tiredness input in the literature (Van Dongen et al. 2003, 14-day dose
     response) but the app has no sleep logging yet, so it contributes 0 until
     sleep data exists. A missing log is not evidence of no sleep.
   - Time of day: the ~1-3pm alertness trough is endogenous — it shows up even
     if you skip lunch entirely (Monk et al. constant-routine work), so it is
     normal, not a problem. Tails into 3-4pm. Late-night (22-1h) and
     early-morning (4-7h) hours are the other low points of the alertness cycle.
   - Food: the most recent meal within a ~2h window moves it two ways. A
     carb-dominant meal quiets the orexin wakefulness neurons (Burdakov et al.
     2005/2006); protein/fiber blunts it, partly via the tryptophan-serotonin
     route (Wurtman). Separately, a big recent meal adds drowsiness on its own:
     larger solid meals shorten sleep-onset latency vs. smaller ones or water
     (Wells et al. 1997). Water clearly under target late in the day counts too
     (~1.5% dehydration brings fatigue, Ganio et al. 2011). Yesterday's drinks —
     and this morning's, which are really last night's — weighted
     dose-dependently (Ebrahim et al. 2013; Penning et al. 2012). Running far
     under the calorie goal into the afternoon counts as its own signal.
   - What does NOT move it: total carbs, nicotine, bloat. */
/* Fatigue estimate — 2026.09.25-e: pure consumption. Jay's call, and he's right:
   no sleep, no body-clock — every point comes from something consumed (or not
   consumed): alcohol, meal size and composition, sugar, water, total calories.
   Time-of-day only gates signals that need the day to unfold (hydration,
   under-fueling); it never adds points on its own. */
function tiredLevel(ds){
  ds = ds || todayStr();
  const d = S.days[ds] || {};
  const cap1 = s => s.charAt(0).toUpperCase()+s.slice(1);
  let pts = 30; const why = [];
  const now = new Date(), hr = now.getHours();
  /* hydration: only a genuine deficit, late in the day */
  const w = waterCalc(ds);
  if(w.target>0 && !w.unset){
    const woz = w.target*8, wr = (d.waterOz||0)/woz;
    if(hr>=14){
      if(wr<0.5){ pts+=8; why.push("Water is under half your target and it's past 2pm — even ~1.5% dehydration brings on fatigue (Ganio et al. 2011)."); }
      else if(wr<0.8){ pts+=4; why.push("Water is at "+Math.round(wr*100)+"% of target this afternoon — mild dehydration drags energy down."); }
    }
  }
  /* most recent meal: transient, two separate food mechanisms.
     2026.09.23-e: meal times are LEARNED from Jay's own logs now (mealTimes),
     falling back to typical times until 3+ logs exist for a meal. */
  const MEAL_AT = {breakfast:8, lunch:12.5, dinner:18.5};
  const wtired = dayType(ds)==="work"; /* 2026.09.27-b: fatigue uses that day's schedule */
  ["breakfast","lunch","dinner"].forEach(m=>{
    const s = mealTimeStats(m, wtired);
    if(s.n>=3) MEAL_AT[m] = s.avg/60;
  });
  const mm = mealMacros(ds);
  let lastM = null, lastAt = -1;
  /* 2026.09.23-l: actual log times beat averages — an off-schedule meal was
     invisible to the recency check (5pm dinner vs 6:30pm average). */
  const nowMs = Date.now();
  ["dinner","lunch","breakfast"].forEach(m=>{
    ((d.meals||{})[m]||[]).forEach(e=>{
      if(e.t && e.t<=nowMs && nowMs-e.t<2*3600e3){
        const dt = new Date(e.t), h = dt.getHours()+dt.getMinutes()/60;
        if(h>lastAt){ lastAt=h; lastM=m; }
      }
    });
  });
  if(!lastM){
    /* entries logged before timestamps existed: fall back to learned averages */
    ["dinner","lunch","breakfast"].forEach(m=>{
      if(mm[m].cal>=200 && MEAL_AT[m]<=hr && MEAL_AT[m]>lastAt){ lastAt = MEAL_AT[m]; lastM = m; }
    });
  }
  if(lastM && (hr-lastAt)<2){
    const x = mm[lastM];
    const carbFrac = x.cal>0 ? (x.c*4)/x.cal : 0;
    const netC = Math.max(0, x.c-x.fiber);
    if(carbFrac>=0.6 && netC>=40){
      const blunted = x.p>=20 || x.fiber>=8;
      pts += blunted ? 4 : 8;
      why.push(cap1(lastM)+" was carb-dominant ("+Math.round(netC)+"g net carbs)"+(blunted?" but the protein/fiber blunts the dip":"")+" — glucose quiets the brain's orexin wakefulness neurons for an hour or two (Burdakov et al. 2005, 2006).");
    }
    if(x.cal>=900 || x.f>=40){
      pts+=6;
      why.push(cap1(lastM)+" was a big meal ("+Math.round(x.cal).toLocaleString()+" kcal) — larger solid meals pull sleepiness up with them, whatever the macros (Wells et al. 1997).");
    }
    else if(x.cal>=650){
      pts+=3;
      why.push(cap1(lastM)+" was a hearty one ("+Math.round(x.cal).toLocaleString()+" kcal) — even a moderately big meal deepens the post-meal dip.");
    }
    /* sugar crash: the "sugar rush" is a myth — sugar lowers alertness and
       raises fatigue within the hour (Mantantzis et al. 2019 meta-analysis) */
    if((x.sugars||0)>=60){
      pts+=4;
      why.push(cap1(lastM)+" carried "+Math.round(x.sugars)+"g sugar — past ~60g the crash outweighs the lift, and fatigue climbs within the hour.");
    }
  }
  /* meal rhythm — 2026.09.23-e: running way past YOUR usual meal time drags
     energy down. Only fires with 5+ logged days for that meal and only when
     the meal is still unlogged today; missing data stays neutral. */
  let overdue = null;
  ["breakfast","lunch","dinner"].forEach(m=>{
    const s = mealTimeStats(m, wtired);
    if(s.n>=5 && (mm[m]||{cal:0}).cal<=0){ /* "unlogged" means nothing logged — matches the now-marker */
      const late = hr - s.avg/60;
      if(late>=1.5 && (!overdue || late>overdue.late)) overdue = {m, late, at:s.avg};
    }
  });
  if(overdue){
    pts += 4;
    why.push(cap1(overdue.m)+" is overdue — you usually eat around "+fmtClock(overdue.at)+
      ", and running past your own rhythm drags energy down.");
  }
  /* yesterday's alcohol — and this morning's, which is really last night's.
     2026.09.25-d: two fixes. (1) Morning-after logging: drinks logged today
     before noon count as last night's (max of the two days, never summed, so
     no double count). (2) Weight: the old term was capped at 9 pts ("light"),
     but dose-dependent next-day fatigue after evening drinking is well
     established (Ebrahim et al. 2013 meta-analysis; Roehrs & Roth 2001;
     Penning et al. 2012) — 3 std drinks now move it ~15 pts instead of 9. */
  const yd = addDays(ds,-1);
  const yStd = isLocked(yd) ? 0 : alcData(S.days[yd]||{}).std, tStd = alcData(d).std; /* 2026.10.09-h: locked days are neutral — skip their alcohol */
  const yalc = Math.max(yStd, hr<12 ? tStd : 0);
  if(yalc>0){
    const p = Math.min(18, Math.round(yalc*5));
    pts+=p;
    why.push(Math.round(yalc)+" drink"+(Math.round(yalc)===1?"":"s")+" "+(hr<12&&tStd>yStd?"last night":"yesterday")+" — next-day fatigue runs dose-dependent with evening drinking (Ebrahim et al. 2013).");
  }
  /* today's alcohol: a sedative in its own right, dose-dependent
     (Roehrs & Roth 2001). Mutually exclusive with the morning-after term
     above, so nothing double-counts. */
  if(hr>=12 && tStd>0){
    const p = Math.min(12, Math.round(tStd*4));
    pts+=p;
    why.push(Math.round(tStd)+" drink"+(Math.round(tStd)===1?"":"s")+" today — alcohol is a sedative; it drags energy down directly, more with every drink.");
  }
  /* under-fueling — 2026.09.25-d: the old model ignored total calories, but
     running on fumes into the afternoon is tiring on its own (Jay's own
     observation: eating after an 889-kcal day pulled his energy back up).
     Only fires on days with food actually logged — a blank log is missing
     data, never evidence. */
  if(hr>=15){
    const goal = goalTotal();
    const ateToday = FOOD_MEALS.some(m=>((d.meals||{})[m]||[]).length>0);
    if(goal>0 && ateToday){
      let eaten = 0;
      FOOD_MEALS.forEach(m=>{ eaten += (mm[m]||{cal:0}).cal; });
      const ratio = eaten/goal;
      if(ratio<0.33){ pts+=10; why.push("Only "+Math.round(eaten).toLocaleString()+" kcal so far ("+Math.round(ratio*100)+"% of your goal) — running on fumes drags energy down on its own."); }
      else if(ratio<0.5){ pts+=6; why.push("At "+Math.round(ratio*100)+"% of your calorie goal by "+fmtClock(hr*60)+" — an under-fueled afternoon feels heavier than a fed one."); }
    }
  }
  const score = Math.max(0, Math.min(100, Math.round(pts)));
  const level = score<=19?1:score<=39?2:score<=59?3:score<=79?4:5;
  return {score, level, label:["","Fresh","Steady","Fading","Heavy","Drained"][level], why};
}
function bloatScore(ds){
  ds = ds || todayStr();
  const mm = mealMacros(ds), d = S.days[ds] || {waterOz:0};
  let sodium=0, fiber=0, sugars=0, pot=0, big=0, bigFat=0, logged=false;
  MEALS.forEach(m=>{ const x=mm[m]; sodium+=x.sodium; fiber+=x.fiber; sugars+=x.sugars; pot+=x.pot;
    big=Math.max(big,x.cal); bigFat=Math.max(bigFat,x.f); if(x.cal>0) logged=true; });
  if(!logged) return {score:null, why:[], label:"–"};
  let pts = 0; const why = [];
  if(sodium>=3500){ pts+=30; why.push(Math.round(sodium).toLocaleString()+"mg sodium — high salt drives water retention and bloating (high-sodium diets raised bloating risk 27%: Peng et al. 2019)."); }
  else if(sodium>=2300){ pts+=16; why.push(Math.round(sodium).toLocaleString()+"mg sodium is over the 2,300mg daily value — expect some water retention."); }
  else if(sodium>=1500){ pts+=7; why.push("Sodium is climbing ("+Math.round(sodium).toLocaleString()+"mg) — watch it if the next meal is salty."); }
  if(pot>=3500 && sodium>=2300){ pts-=8; why.push("Good potassium ("+Math.round(pot).toLocaleString()+"mg) helps flush sodium — blunting the bloat."); }
  let fsum=0, fn=0;
  for(let i=1;i<=7;i++){
    const ds=addDays(todayStr(),-i); if(isLocked(ds)) continue; /* 2026.10.08-f */
    const dd = S.days[ds]; if(!dd) continue;
    let f=0;
    MEALS.forEach(m=>(dd.meals[m]||[]).forEach(e=>(e.nutrs||[]).forEach(x=>{
      if(canonNutr(x.n)==="Fiber"){ const u=String(x.u||"").toLowerCase(); f += u==="g"?x.amt : u==="mg"?x.amt/1000 : u==="mcg"?x.amt/1e6 : x.amt; }
    })));
    if(f>0){ fsum+=f; fn++; }
  }
  const favg = fn>0 ? fsum/fn : 0;
  if(favg>=5 && fiber>=20 && fiber>favg*1.5){ pts+=25; why.push("Fiber jumped to "+Math.round(fiber)+"g vs your usual "+Math.round(favg)+"g — gut bacteria ferment the sudden extra fiber into gas."); }
  else if(fiber>=40){ pts+=12; why.push("Very high-fiber day ("+Math.round(fiber)+"g) — healthy, but gas-producing."); }
  if(sugars>=75){ pts+=14; why.push(Math.round(sugars)+"g sugar — excess sugar ferments in the gut and adds gas."); }
  else if(sugars>=50){ pts+=7; why.push(Math.round(sugars)+"g sugar — a mild gas risk."); }
  if(big>=900 || bigFat>=40){ pts+=14; why.push("Big"+(bigFat>=40?", fatty":"")+" meal ("+Math.round(big).toLocaleString()+" kcal) — fat slows stomach emptying, so the fullness lingers."); }
  else if(big>=650){ pts+=7; why.push("Hearty meal ("+Math.round(big).toLocaleString()+" kcal) — some fullness expected."); }
  const w = waterCalc(ds), wr = w.target>0 ? (d.waterOz||0)/(w.target*8) : 1;
  if(w.target>0 && wr<0.75){ pts+=10; why.push("Behind on water ("+Math.round(wr*100)+"% of target) — when you're dry the body holds onto water, adding to the puff."); }
  const alc = alcData(d).std;
  if(alc>0){ pts+=5; why.push("Alcohol irritates the gut lining — a small extra bloat nudge."); }
  const score = Math.max(0, Math.min(100, Math.round(pts)));
  return {score, why, label: score<=25?"Comfortable":score<=50?"Full":score<=75?"Bloated":"Very bloated"};
}
function scoreInfoHTML(){
  const a = adherenceStats(), t = tiredLevel(), b = bloatScore();
  const aRow = a.pct===null
    ? `<div class="irow"><b>Adherence:</b> no logged days in the last 2 weeks yet — log meals and this fills in.</div>`
    : `<div class="irow"><b>Adherence: ${a.pct}%</b> — ${a.hit} of ${a.n} logged days (last 14) hit calories within ±10% of goal and protein ≥90%. Research finds sticking to the plan predicts results better than the plan itself (Burke et al. 2011).</div>`;
  const tHead = `<div class="irow"><b>Fatigue: ${t.level}/5 — ${t.label}.</b> An estimate of fatigue from what you consumed, rebuilt from research: it starts at Steady and only moves on real consumption signals — last night's drinks weighted by dose (drinks you log in the morning count as last night's — Ebrahim et al. 2013), drinks today (alcohol is a sedative — Roehrs & Roth 2001), a carb-dominant or oversized recent meal (glucose quiets the orexin wakefulness neurons — Burdakov et al. 2005, 2006; meal size scales post-meal sleepiness — Wells et al. 1997), a sugary meal's crash (Mantantzis et al. 2019), water well under target late in the day (Ganio et al. 2011), and running far under your calorie goal. No sleep tracking, no body-clock — sleep, stress, and illness still matter, the app just can't see them. Missing data never makes it worse.</div>`;
  const tRows = t.why.length
    ? t.why.map(w=>`<div class="irow">• ${esc(w)}</div>`).join("")
    : `<div class="irow">Nothing moving the needle right now.</div>`;
  const bHead = `<div class="irow"><b>Bloat: ${b.score===null?"–":b.score+"/100 — "+b.label}.</b> Predicted from today's sodium, fiber, sugar, meal size, water, and alcohol. In a randomized trial, high-sodium diets raised bloating risk 27% and high-fiber diets 41% (Peng et al., Am J Gastroenterol 2019).</div>`;
  const bRows = b.why.length
    ? b.why.map(w=>`<div class="irow">• ${esc(w)}</div>`).join("")
    : `<div class="irow">${b.score===null?"Log food today and this predicts bloating.":"Nothing bloating you today."}</div>`;
  return aRow+tHead+tRows+bHead+bRows+
    `<div class="irow" style="color:var(--muted)">Rough predictions from your log, not medical verdicts — sleep, stress, and illness matter too, and the app can't see those.</div>`;
}

/* ============ SCORE WHEELS (Diary hero minis) ============ */
function paintWheel(arcId, numId, frac, color, label){
  const arc = document.getElementById(arcId);
  const C = 2*Math.PI*36;
  arc.style.strokeDasharray = C;
  arc.style.strokeDashoffset = frac===null ? C : C*(1-frac);
  arc.style.stroke = color;
  document.getElementById(numId).textContent = label;
}
function paintScoreWheel(){
  const a = adherenceStats(), t = tiredLevel(), b = bloatScore();
  const aFrac = a.pct===null ? null : Math.min(a.pct,100)/100;
  const aTxt = a.pct===null ? "–" : a.pct+"%";
  const aColH = "#ffffff"; /* white fill (2026.10.14-i, Jay) */
  paintWheel("adhArcH","adhNumH",aFrac,aColH,aTxt);
  const tFrac = t.level/5;
  const tTxt = t.level;
  const tColH = t.level<=2?"#2fe3b6":t.level===3?"#ffffff":t.level===4?"#ffd23d":"#ff8a9d";
  paintWheel("tiredArcH","tiredNumH",tFrac,tColH,tTxt);
  const bFracH = b.score===null ? null : b.score/100;
  const bTxtH = b.score===null ? "–" : b.score+"%";
  const bColH = "#ffffff"; /* white fill (2026.10.14-i, Jay) */
  paintWheel("bloatArcH","bloatNumH",bFracH,bColH,bTxtH);
}
document.getElementById("adhWheelH").onclick = ()=>openInfo("scores");
document.getElementById("tiredWheelH").onclick = ()=>openInfo("scores");
document.getElementById("bloatWheelH").onclick = ()=>openInfo("scores");

/* ============ PROGRESS PHOTOS ============ */
let photoOrder = [], photoIdx = 0;
function renderPhotoStrip(){
  photoOrder = ((S.profile||{}).photos||[]).slice().sort((a,b)=>a.d<b.d?1:-1);
  const el = document.getElementById("photoStrip");
  el.innerHTML = `<button class="photoadd" id="photoAdd" aria-label="Add progress photo">+</button>` +
    photoOrder.map((p,i)=>`<button class="phototile" data-i="${i}"><img src="${p.img}" alt="Progress photo ${esc(p.d)}"><span class="pdate">${new Date(p.d+"T12:00:00").toLocaleDateString(undefined,{month:"short",day:"numeric"})}</span></button>`).join("");
  document.getElementById("photoAdd").onclick = ()=>document.getElementById("progPhotoFile").click();
  el.querySelectorAll(".phototile").forEach(b=>b.onclick=()=>openPhotoBox(+b.dataset.i));
}
function openPhotoBox(i){ photoIdx = i; paintPhotoBox(); document.getElementById("photoBox").classList.add("open"); }
function closePhotoBox(){ document.getElementById("photoBox").classList.remove("open"); }
function paintPhotoBox(){
  const p = photoOrder[photoIdx]; if(!p) return closePhotoBox();
  document.getElementById("photoImg").src = p.img;
  document.getElementById("photoDate").textContent = new Date(p.d+"T12:00:00").toLocaleDateString(undefined,{weekday:"long", month:"long", day:"numeric"});
  const multi = photoOrder.length>1;
  document.getElementById("photoPrev").style.display = multi?"":"none";
  document.getElementById("photoNext").style.display = multi?"":"none";
}
document.getElementById("photoX").onclick = closePhotoBox;
document.getElementById("photoBox").onclick = e=>{ if(e.target.id==="photoBox"||e.target.id==="photoImg") closePhotoBox(); };
document.getElementById("photoPrev").onclick = ()=>{ photoIdx=(photoIdx-1+photoOrder.length)%photoOrder.length; paintPhotoBox(); };
document.getElementById("photoNext").onclick = ()=>{ photoIdx=(photoIdx+1)%photoOrder.length; paintPhotoBox(); };
document.getElementById("photoDel").onclick = ()=>{
  const p = photoOrder[photoIdx];
  if(p && confirm("Delete this progress photo?")){
    if(!S.profile) S.profile = {};
    S.profile.photos = (S.profile.photos||[]).filter(x=>x!==p);
    save(); renderPhotoStrip(); closePhotoBox();
  }
};
document.getElementById("progPhotoFile").onchange = e=>{
  const file = e.target.files[0]; if(!file) return;
  const url = URL.createObjectURL(file);
  const img = new Image();
  img.onload = ()=>{
    try{
      const max = 720, scale = Math.min(1, max/Math.max(img.width,img.height));
      const cv = document.createElement("canvas");
      cv.width = Math.max(1,Math.round(img.width*scale)); cv.height = Math.max(1,Math.round(img.height*scale));
      cv.getContext("2d").drawImage(img,0,0,cv.width,cv.height);
      if(!S.profile) S.profile = {};
      if(!S.profile.photos) S.profile.photos = [];
      S.profile.photos.push({d: todayStr(), img: cv.toDataURL("image/jpeg",0.75)});
      while(S.profile.photos.length>40){ let oi=0; for(let i=1;i<S.profile.photos.length;i++) if(S.profile.photos[i].d<S.profile.photos[oi].d) oi=i; S.profile.photos.splice(oi,1); }
      save(); renderPhotoStrip();
    }catch(err){ alert("Couldn't use that photo."); }
    URL.revokeObjectURL(url);
  };
  img.onerror = ()=>{ URL.revokeObjectURL(url); alert("Couldn't read that photo."); };
  img.src = url;
  e.target.value = "";
};

/* ============ MICRONUTRIENT TRACKING ============ */
/* FDA Daily Values (adults) — the default goal for every nutrient; where the NIH/NASEM
   recommendation depends on sex/age, profileNutrTarget() switches it to his own RDA/AI
   once his profile has sex/age. Custom per-nutrient targets always win. */
const NUTR_DV = {
  "Vitamin A":{dv:900,unit:"mcg"}, "Vitamin C":{dv:90,unit:"mg"}, "Vitamin D":{dv:20,unit:"mcg",iu:40},
  "Vitamin E":{dv:15,unit:"mg"}, "Vitamin K":{dv:120,unit:"mcg"},
  "Thiamin":{dv:1.2,unit:"mg"}, "Riboflavin":{dv:1.3,unit:"mg"}, "Niacin":{dv:16,unit:"mg"},
  "Vitamin B6":{dv:1.7,unit:"mg"}, "Folate":{dv:400,unit:"mcg"}, "Vitamin B12":{dv:2.4,unit:"mcg"},
  "Biotin":{dv:30,unit:"mcg"}, "Pantothenic acid":{dv:5,unit:"mg"},
  "Calcium":{dv:1300,unit:"mg"}, "Iron":{dv:18,unit:"mg"}, "Phosphorus":{dv:1250,unit:"mg"},
  "Iodine":{dv:150,unit:"mcg"}, "Magnesium":{dv:420,unit:"mg"}, "Zinc":{dv:11,unit:"mg"},
  "Selenium":{dv:55,unit:"mcg"}, "Copper":{dv:0.9,unit:"mg"}, "Manganese":{dv:2.3,unit:"mg"},
  "Chromium":{dv:35,unit:"mcg"}, "Molybdenum":{dv:45,unit:"mcg"}, "Chloride":{dv:2300,unit:"mg"},
  "Potassium":{dv:4700,unit:"mg"}, "Sodium":{dv:2300,unit:"mg",limit:true},
  "Fiber":{dv:28,unit:"g"}, "Cholesterol":{dv:300,unit:"mg",limit:true},
  "Saturated Fat":{dv:20,unit:"g",limit:true}, "Added Sugars":{dv:50,unit:"g",limit:true}
}; /* limit:true = the FDA Daily Value is an upper limit ("less than"), not a goal to hit */
const NUTR_ALIASES = [
  [/vitamin\s*d|cholecalciferol/i,"Vitamin D"], [/vitamin\s*a|retinol/i,"Vitamin A"],
  [/vitamin\s*b6|pyridoxine/i,"Vitamin B6"], [/vitamin\s*b12|cobalamin/i,"Vitamin B12"],
  [/vitamin\s*c|ascorbic/i,"Vitamin C"], [/vitamin\s*e|tocopherol|tocotrienol/i,"Vitamin E"],
  [/vitamin\s*k/i,"Vitamin K"], [/thiamin|vitamin\s*b1/i,"Thiamin"], [/riboflavin|vitamin\s*b2/i,"Riboflavin"],
  [/niacin|nicotin|vitamin\s*b3/i,"Niacin"], [/folate|folic|vitamin\s*b9/i,"Folate"],
  [/biotin|vitamin\s*b7/i,"Biotin"], [/pantothenic|vitamin\s*b5/i,"Pantothenic acid"],
  [/calcium/i,"Calcium"], [/iron/i,"Iron"], [/magnesium/i,"Magnesium"], [/phosphorus/i,"Phosphorus"],
  [/iodine/i,"Iodine"], [/zinc/i,"Zinc"], [/selenium/i,"Selenium"], [/copper/i,"Copper"],
  [/manganese/i,"Manganese"], [/chromium/i,"Chromium"], [/molybdenum/i,"Molybdenum"],
  [/potassium/i,"Potassium"], [/\bsodium\b/i,"Sodium"], [/chloride/i,"Chloride"],
  [/fiber|fibre/i,"Fiber"], [/added\s*sugars?/i,"Added Sugars"], [/sugar/i,"Sugars"],
  [/saturated\s*fat/i,"Saturated Fat"], [/cholesterol/i,"Cholesterol"], [/creatine/i,"Creatine"]
];
/* Nutrient categories — grouped the way nutrition science groups them (Cronometer-style):
   Vitamins (fat-soluble A/D/E/K + water-soluble C and the B-complex),
   Minerals (major/electrolyte + trace), Fats (lipids + cholesterol),
   Carbs & Fiber, and Other (creatine and anything unmatched). */
const NUTR_CAT_ORDER = ["Vitamins","Minerals","Fats","Carbs & Fiber","Other"];
const NUTR_CAT = {
  "Vitamin A":"Vitamins","Vitamin C":"Vitamins","Vitamin D":"Vitamins","Vitamin E":"Vitamins","Vitamin K":"Vitamins",
  "Thiamin":"Vitamins","Riboflavin":"Vitamins","Niacin":"Vitamins","Vitamin B6":"Vitamins","Folate":"Vitamins",
  "Vitamin B12":"Vitamins","Biotin":"Vitamins","Pantothenic acid":"Vitamins",
  "Calcium":"Minerals","Iron":"Minerals","Phosphorus":"Minerals","Iodine":"Minerals","Magnesium":"Minerals",
  "Zinc":"Minerals","Selenium":"Minerals","Copper":"Minerals","Manganese":"Minerals","Chromium":"Minerals",
  "Molybdenum":"Minerals","Chloride":"Minerals","Potassium":"Minerals","Sodium":"Minerals","Fluoride":"Minerals",
  "Saturated Fat":"Fats","Trans Fat":"Fats","Monounsaturated Fat":"Fats","Polyunsaturated Fat":"Fats",
  "Cholesterol":"Fats","Omega-3":"Fats","Omega-6":"Fats",
  "Fiber":"Carbs & Fiber","Sugars":"Carbs & Fiber","Added Sugars":"Carbs & Fiber","Sugar Alcohol":"Carbs & Fiber"
};
function nutrCat(disp){ return NUTR_CAT[disp] || "Other"; }
let ncatCollapsed = {};
try{ ncatCollapsed = JSON.parse(localStorage.getItem("fuel_ncat_collapsed")||"{}")||{}; }catch(e){ ncatCollapsed = {}; }
function saveNcatCollapsed(){ try{ localStorage.setItem("fuel_ncat_collapsed", JSON.stringify(ncatCollapsed)); }catch(e){} }
/* Nutrient bar color: gray when just starting → dark blue midway → pastel green at target */
function nbarColor(p){
  p = Math.max(0, Math.min(100, p==null?0:p))/100;
  const GRAY=[154,161,171], BLUE=[29,78,216], GREEN=[126,212,150];
  let a,b,t;
  if(p<=0.5){ a=GRAY; b=BLUE; t=p/0.5; } else { a=BLUE; b=GREEN; t=(p-0.5)/0.5; }
  const c = a.map((v,i)=>Math.round(v+(b[i]-v)*t));
  return "rgb("+c[0]+","+c[1]+","+c[2]+")";
}
function nutrRowHtml(r){
  const vs = r1(r.val);
  const overLim = r.limit && r.pct!=null && r.pct>=100;
  const right = r.target!=null
    ? `<b><i class="${r.pct>=100&&!r.limit?"met":""}${overLim?" lim":""}">${vs}</i> / ${r1(r.target)}</b>`
    : `<b>${vs}</b>`;
  const bar = r.pct!=null ? `<div class="nbar"><i style="width:${Math.min(r.pct,100)}%;background:${overLim?"#ff5c5c":nbarColor(r.pct)}"></i></div>` : "";
  return `<div class="nrow" data-n="${esc(r.disp)}"><div class="nhead"><span>${esc(r.disp)} (${r.unit})${r.custom?' <span class="diy">MY TARGET</span>':""}</span>${right}</div>${bar}</div>`;
}
function nutrMet(r){ return r.pct!=null && (r.limit ? r.pct<100 : r.pct>=100); }
function canonNutr(name){
  const t = String(name||"").trim();
  for(const [re,d] of NUTR_ALIASES) if(re.test(t)) return d;
  return t.replace(/\w\S*/g, w=>w.charAt(0).toUpperCase()+w.slice(1).toLowerCase());
}
const WT2MG = {g:1000, mg:1, mcg:0.001};
const FIBER_DV = 28; /* FDA Daily Value, g — shown for reference in the nutrient sheet */
/* Fiber target: his own custom target if set, else the research auto-target —
   14 g per 1,000 kcal of the daily calorie goal (FDA Daily Value 28 g @ 2,000 kcal;
   Institute of Medicine adequate intake 14 g/1,000 kcal). Blank slate: 0 until the goal exists. */
function fiberTarget(){ const ct = (S.goals.nutrTargets||{})["Fiber"]; if(ct && ct.val>0) return ct.val; const tot = goalTotal(); return tot>0 ? Math.round(14*tot/1000) : 0; }
/* ================= ANALYTICS ENGINE — MICRONUTRIENTS =================
   Research sources (2026 refresh): fiber 14 g/1,000 kcal (IOM, still current);
   FDA Daily Values are label values (2016 table), not personalized goals.
   Potassium: NASEM 2019 adequate intake 3,400 mg/d men / 2,600 mg/d women —
   the label DV is still 4,700 mg (set from the older AI), shown for reference. */
function potassiumTarget(){ const ct = (S.goals.nutrTargets||{})["Potassium"]; if(ct && ct.val>0) return ct.val; const sx = String((S.goals.profile||{}).sex||"").toLowerCase(); return (sx==="f" || sx==="female") ? 2600 : (sx==="m" || sx==="male") ? 3400 : 0; /* 2026.11.25-c: no assumed sex */ }
/* Personal nutrient targets (2026.11.25-c). Adult (19+) Recommended Dietary
   Allowances / Adequate Intakes from the NIH Office of Dietary Supplements
   (NASEM Dietary Reference Intakes), by sex and age. Under 19 there is no
   adult table here, so the general FDA Daily Value is used instead.
   Returns {val, label} or null. */
function profileNutrTarget(disp){
  const p = (S.goals||{}).profile || {}, sex = String(p.sex||"").toLowerCase(), age = effAge(p);
  const M = sex==="m" || sex==="male", F = sex==="f" || sex==="female";
  if(!(M||F) || !(age>=19)) return null;
  const x = M ? "male" : "female";
  const R = (val, kind, ages) => ({val, label: (kind||"RDA")+" · "+x+(ages ? " "+ages : "")});
  switch(disp){
    case "Vitamin A":  return R(M?900:700);
    case "Vitamin C":  return R(M?90:75);
    case "Vitamin D":  return age>=71 ? R(20,"RDA","71+") : R(15,"RDA","19–70");
    case "Vitamin E":  return R(15);
    case "Vitamin K":  return R(M?120:90,"AI");
    case "Thiamin":    return R(M?1.2:1.1);
    case "Riboflavin": return R(M?1.3:1.1);
    case "Niacin":     return R(M?16:14);
    case "Vitamin B6": return age>=51 ? R(M?1.7:1.5,"RDA","51+") : R(1.3,"RDA","19–50");
    case "Folate":     return R(400);
    case "Vitamin B12":return R(2.4);
    case "Biotin":     return R(30,"AI");
    case "Pantothenic acid": return R(5,"AI");
    case "Calcium":    return (M ? age>=71 : age>=51) ? R(1200,"RDA",M?"71+":"51+") : R(1000,"RDA",M?"19–70":"19–50");
    case "Iron":       return (M || age>=51) ? R(8,"RDA",F?"51+":"") : R(18,"RDA","19–50");
    case "Magnesium":  return age>=31 ? R(M?420:320,"RDA","31+") : R(M?400:310,"RDA","19–30");
    case "Zinc":       return R(M?11:8);
    case "Phosphorus": return R(700);
    case "Iodine":     return R(150);
    case "Selenium":   return R(55);
    case "Copper":     return R(0.9);
    case "Manganese":  return R(M?2.3:1.8,"AI");
    case "Chromium":   return age>=51 ? R(M?30:20,"AI","51+") : R(M?35:25,"AI","19–50");
    case "Molybdenum": return R(45);
    case "Chloride":   return age>=71 ? R(1800,"AI","71+") : age>=51 ? R(2000,"AI","51–70") : R(2300,"AI","19–50");
    default: return null;
  }
}
/* The one place a nutrient's default target is chosen (custom targets are
   applied before this). Blank until the profile is complete — no generic
   targets before you have entered who you are. */
function defaultNutrTarget(disp){
  if(!profileReady()) return null;
  const tot = goalTotal();
  if(disp==="Fiber"){ const v = fiberTarget(); return v>0 ? {val:v, src:"auto", label:"14 g per 1,000 kcal of your goal"} : null; }
  if(disp==="Potassium"){ const v = potassiumTarget(); return v>0 ? {val:v, src:"ai", label:"NASEM 2019 adequate intake"} : null; }
  if(disp==="Saturated Fat" && tot>0) return {val:Math.round(tot*0.10/9), src:"goal", label:"limit · 10% of your "+Math.round(tot).toLocaleString()+" kcal goal (DGA 2020–2025)"};
  if(disp==="Added Sugars" && tot>0) return {val:Math.round(tot*0.10/4), src:"goal", label:"limit · 10% of your "+Math.round(tot).toLocaleString()+" kcal goal (DGA 2020–2025)"};
  const prof = profileNutrTarget(disp);
  if(prof) return {val:prof.val, src:"profile", label:prof.label};
  const dv = NUTR_DV[disp];
  return dv ? {val:dv.dv, src:"fda", label:"FDA Daily Value"} : null;
}
function fiberTotal(k){
  const d = S.days[k]; let f = 0;
  if(d) MEALS.forEach(m=>(d.meals[m]||[]).forEach(e=>(e.nutrs||[]).forEach(x=>{
    if(canonNutr(x.n)==="Fiber"){ const u=String(x.u||"").toLowerCase(); f += x.amt*(WT2MG[u]||1)/1000; }
  })));
  return f;
}
function dayNutrients(k){
  const d = S.days[k], map = new Map();
  if(d) MEALS.forEach(m=>(d.meals[m]||[]).forEach(e=>(e.nutrs||[]).forEach(x=>{
    const disp = canonNutr(x.n), u = String(x.u||"").toLowerCase();
    let cls = u==="iu" ? "iu" : u==="ml" ? "ml" : "wt", base;
    const cv = NUTR_DV[disp];
    if(cls==="iu" && cv && cv.iu){ cls = "wt"; base = x.amt/cv.iu*(WT2MG[cv.unit]||1); } /* IU folds into the weight row (vitamin D: 40 IU = 1 mcg) */
    else base = cls==="wt" ? x.amt*(WT2MG[u]||1) : x.amt;
    const key = disp+"\x00"+cls;
    if(!map.has(key)) map.set(key, {disp, cls, base:0});
    map.get(key).base += base;
  })));
  const out = [];
  map.forEach(v=>{
    const dv = NUTR_DV[v.disp], ct = (S.goals.nutrTargets||{})[v.disp];
    let val, unit, pct = null, target = null, custom = false, src = null, srcLabel = "";
    if(ct && v.cls==="wt"){
      let cu = ct.unit, cvv = ct.val;
      if(String(cu).toLowerCase()==="iu" && dv && dv.iu){ cu = dv.unit; cvv = cvv/dv.iu; } /* custom target stored in IU → weight unit */
      if(WT2MG[cu]){ unit = cu; val = v.base/WT2MG[cu]; target = cvv; pct = val/cvv*100; custom = true; }
    } else if(ct && v.cls==="iu" && ct.unit==="IU"){
      unit = "IU"; val = v.base; target = ct.val; pct = val/ct.val*100; custom = true;
    } else if(v.cls==="wt" && dv){
      unit = dv.unit; val = v.base/(WT2MG[unit]||1);
      const dt = defaultNutrTarget(v.disp); /* 2026.11.25-c: blank until your profile is complete */
      if(dt){ target = dt.val; src = dt.src; srcLabel = dt.label; pct = target>0 ? val/target*100 : 0; }
    } else if(v.cls==="iu" && dv && dv.iu){
      unit = "IU"; val = v.base; target = 0; pct = 0;
    } else if(v.cls==="wt"){
      val = v.base; unit = val>=1000 ? "g" : "mg"; if(unit==="g") val = val/1000;
    } else { val = v.base; unit = v.cls==="iu" ? "IU" : "mL"; }
    out.push({disp:v.disp, val, unit, target, pct, custom, src, srcLabel, limit:!custom&&!!(dv&&dv.limit), dvRef:dv||null});
  });
  /* 2026.09.24-e: every tracked nutrient always shows its goal, even with zero intake
     today — the list is never "empty". Rows without logged data sit at 0 under their
     default target (custom > profile RDA/AI > FDA Daily Value), so extremes like a
     high-sodium day always get flagged. */
  const haveDisp = new Set(out.map(r=>r.disp));
  Object.keys(NUTR_DV).forEach(disp=>{
    if(haveDisp.has(disp)) return;
    const dv = NUTR_DV[disp], ct = (S.goals.nutrTargets||{})[disp];
    let target = null, src = null, srcLabel = "", custom = false;
    if(ct && ct.val>0){ target = ct.val; custom = true; }
    else { const dt = defaultNutrTarget(disp); if(dt){ target = dt.val; src = dt.src; srcLabel = dt.label; } }
    out.push({disp, val:0, unit:dv.unit, target, pct: target>0 ? 0 : null, custom, src, srcLabel, limit:!custom&&!!dv.limit, dvRef:dv});
  });
  out.sort((a,b)=>((b.pct===null?-1:b.pct)-(a.pct===null?-1:a.pct)) || a.disp.localeCompare(b.disp));
  return out;
}
function paintNutrients(k){
  const rows = dayNutrients(k), box = document.getElementById("nutrTable");
  /* coverage, food-based: logged entries carrying nutrient data vs all logged food entries */
  const d = S.days[k]||emptyDay();
  let totalFoods = 0, withNutr = 0;
  MEALS.forEach(m=>((d.meals||{})[m]||[]).forEach(e=>{
    if(e.kind==="supp") return;
    totalFoods++;
    if((e.nutrs&&e.nutrs.length) || (((findFood(e.n)||{}).nutrs||[]).length)) withNutr++;
  }));
  const nn = document.getElementById("nutrNote");
  nn.textContent = (profileReady() ? "" : "Targets appear once your stats are complete (still needed: "+profileMissingText()+"). ") + (totalFoods
    ? "Based on "+withNutr+" of "+totalFoods+" foods today — add vitamins & minerals when creating custom foods to fill the gaps."
    : "No foods logged yet — add vitamins & minerals when creating custom foods to fill the gaps.");
  nn.style.display = "";
  if(!rows.length){
    box.innerHTML = `<div class="empty">No nutrient data yet.<br>Add vitamins &amp; minerals when creating custom foods.</div>`;
  } else {
    const groups = {};
    rows.forEach(r=>{ const c = nutrCat(r.disp); (groups[c] = groups[c]||[]).push(r); });
    box.innerHTML = NUTR_CAT_ORDER.filter(c=>groups[c]&&groups[c].length).map(c=>{
      const rs = groups[c], collapsed = !!ncatCollapsed[c];
      const tracked = rs.filter(r=>r.pct!=null), met = tracked.filter(nutrMet).length;
      return `<div class="ncat" data-c="${esc(c)}"><span class="ncat-t">${esc(c)}</span>`
        + `<span class="ncat-sub">${met}/${tracked.length}</span>`
        + `<span class="ncat-chev">${collapsed?"›":"⌄"}</span></div>`
        + (collapsed ? "" : `<div class="ncat-body">${rs.map(nutrRowHtml).join("")}</div>`);
    }).join("");
    box.querySelectorAll(".ncat").forEach(el=>el.onclick=()=>{
      const c = el.dataset.c; ncatCollapsed[c] = !ncatCollapsed[c]; saveNcatCollapsed(); paintNutrients(viewDate());
    });
    box.querySelectorAll(".nrow").forEach(el=>el.onclick=()=>openNSheet(el.dataset.n));
  }
}

/* ============ NUTRIENT TARGET SHEET ============ */
const nsheet = document.getElementById("nsheet");
let nKey = null, nUnit = "";
function openNSheet(disp){
  const r = dayNutrients(viewDate()).find(x=>x.disp===disp); if(!r) return;
  nKey = disp; nUnit = r.unit;
  document.getElementById("nName").textContent = disp;
  document.getElementById("nToday").textContent = r1(r.val)+" "+r.unit;
  document.getElementById("nDV").textContent = r.custom ? r1(r.target)+" "+r.unit+" (yours)"
    : (nKey==="Fiber" ? "Auto: "+r1(fiberTarget())+" "+r.unit+" · 14 g per 1,000 kcal of your "+goalTotal().toLocaleString()+" kcal goal"
      : (nKey==="Potassium" ? "Goal: "+r1(potassiumTarget())+" "+r.unit+" · NASEM 2019 adequate intake (label DV 4,700 mg for reference)"
      : (r.target!=null ? "Goal: "+r1(r.target)+" "+r.unit+(r.src==="profile" ? " · personalized for you ("+r.srcLabel+")" : " · FDA Daily Value") : "No daily goal")));
  document.getElementById("nClear").textContent = nKey==="Fiber" ? "Back to auto target" : (nKey==="Potassium" ? "Back to AI goal" : "Back to default goal");
  const ct = (S.goals.nutrTargets||{})[disp];
  const nt = document.getElementById("nTarget");
  nt.value = ct ? ct.val : "";
  nt.placeholder = r.target!=null ? String(r1(r.target)) : "—";
  document.getElementById("nUnit").textContent = r.unit;
  nsheet.classList.add("open");
}
document.getElementById("nScrim").onclick = ()=>nsheet.classList.remove("open");
document.getElementById("nX").onclick = ()=>nsheet.classList.remove("open");
document.getElementById("nSave").onclick = ()=>{
  const v = parseFloat(document.getElementById("nTarget").value);
  if(!(v>0)) return;
  S.goals.nutrTargets = S.goals.nutrTargets||{};
  S.goals.nutrTargets[nKey] = {val:v, unit:nUnit};
  save(); nsheet.classList.remove("open"); renderAnalysis();
};
document.getElementById("nClear").onclick = ()=>{
  if(S.goals.nutrTargets) delete S.goals.nutrTargets[nKey];
  save(); nsheet.classList.remove("open"); renderAnalysis();
};
/* Reset all: clear every custom nutrient target → goals fall back to the defaults
   (FDA Daily Values, personalized by his profile where the recommendation differs) */
document.getElementById("nutrResetAll").onclick = ()=>{
  if(!confirm("Clear all your custom nutrient targets and go back to the default goals?\n\nDefaults are the FDA Daily Values — automatically personalized by your age/sex from your profile where the recommendation differs (like iron).")) return;
  S.goals.nutrTargets = {};
  save(); renderAnalysis();
};

/* ============ ANALYSIS ============ */
function renderAnalysis(){
  const k = viewDate(), g = S.goals, t = totals(k), mc = mealCals(k);
  const dt = new Date(k+"T12:00:00");
  $("analysisTitle").textContent = k===todayStr() ? "Today" : (dt.getMonth()+1)+"/"+dt.getDate()+"/"+String(dt.getFullYear()).slice(2);
  const mCal = g.maintenance>0?g.maintenance:0, tCal = mCal+(g.surplus>0?g.surplus:0);
  $("aCal").textContent = Math.round(t.cal).toLocaleString();
  $("aGoal").innerHTML = FLAGI + Math.round(tCal).toLocaleString();
  const C = 339.29;
  let acc = 0, segHtml = "";
  MEALS.forEach(m => {
    const frac = tCal>0 ? mc[m]/tCal : 0;
    if(frac > 0.004){
      segHtml += `<circle cx="64" cy="64" r="54" fill="none" stroke="${MEAL_SEG[m]}" stroke-width="13" stroke-dasharray="${(C*frac).toFixed(2)} ${C.toFixed(2)}" stroke-dashoffset="${(-C*acc).toFixed(2)}" stroke-linecap="butt"/>`;
    }
    acc += frac;
  });
  $("aSeg").innerHTML = segHtml;
  const tot = t.cal;
  $("aMealTable").innerHTML = MEALS.map(m=>{
    const pct = tot>0 ? Math.round(mc[m]/tot*100) : 0;
    return `<tr><td><span class="mdot" style="background:${MEAL_SEG[m]}"></span>${MEAL_LABEL[m]}</td><td>${Math.round(mc[m]).toLocaleString()} kcal</td><td>${pct}%</td></tr>`;
  }).join("");
  $("aNote").innerHTML = tot>0
    ? `<b style="color:var(--ink)">${Math.round(tCal-tot).toLocaleString()} kcal</b> to your daily target of ${Math.round(tCal).toLocaleString()}.<br>Protein ${r1(t.p)}g of ${g.protein}g.`
    : `Nothing logged yet.<br>Tap + on a meal to start.`;
  $("abarC").style.width = barW(t.c,g.carbs);
  $("abarP").style.width = barW(t.p,g.protein);
  $("abarF").style.width = barW(t.f,g.fat);
  $("abarFi").style.width = barW(fiberTotal(k),fiberTarget());
  $("avalCv").textContent = r1(t.c); $("avalCg").textContent = tgtTxt(g.carbs);
  $("avalPv").textContent = r1(t.p); $("avalPg").textContent = tgtTxt(g.protein);
  $("avalFv").textContent = r1(t.f); $("avalFg").textContent = tgtTxt(g.fat);
  $("avalFiv").textContent = r1(fiberTotal(k)); $("avalFig").textContent = tgtTxt(fiberTarget());
  paintNutrients(k);
}
