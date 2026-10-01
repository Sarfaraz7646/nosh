const image = (id, width = 1200) =>
  `https://images.unsplash.com/${id}?auto=format&fit=crop&w=${width}&q=85`

export const restaurants = [
  {
    id: 'copper-tiffin',
    name: 'Copper Tiffin',
    cuisine: ['North Indian', 'Comfort food'],
    rating: 4.8,
    deliveryTime: '25–30 min',
    priceForTwo: 450,
    offer: '20% off up to ₹120',
    image: image('photo-1546833999-b9f581a1996d'),
    address: 'Indiranagar, Bengaluru',
    description: 'Slow-cooked classics, generous portions, and a little extra ghee.',
    menu: [
      { id: 'copper-dal', name: 'Dal makhani', description: 'Black lentils simmered overnight, finished with cream.', price: 285, category: 'House favourites', image: image('photo-1546833999-b9f581a1996d', 600), isVeg: true, bestseller: true },
      { id: 'copper-paneer', name: 'Paneer tikka masala', description: 'Charred paneer in a tomato-cashew gravy.', price: 325, category: 'House favourites', image: image('photo-1631452180519-c014fe946bc7', 600), isVeg: true },
      { id: 'copper-biryani', name: 'Lucknowi veg biryani', description: 'Fragrant basmati, seasonal vegetables, and saffron.', price: 310, category: 'Rice & biryani', image: image('photo-1563379091339-03246963d96c', 600), isVeg: true },
      { id: 'copper-kulcha', name: 'Butter kulcha', description: 'Tandoor-baked and brushed with cultured butter.', price: 75, category: 'Breads', image: image('photo-1626082927389-6cd097cdc6ec', 600), isVeg: true },
    ],
  },
  {
    id: 'little-lemon',
    name: 'Little Lemon Kitchen',
    cuisine: ['Mediterranean', 'Healthy'],
    rating: 4.6,
    deliveryTime: '20–25 min',
    priceForTwo: 600,
    offer: 'Free delivery',
    image: image('photo-1547592180-85f173990554'),
    address: 'Koramangala, Bengaluru',
    description: 'Bright bowls, warm pita, and market-fresh Mediterranean plates.',
    menu: [
      { id: 'lemon-bowl', name: 'Green goddess bowl', description: 'Avocado, grains, cucumber, herbs, and lemon tahini.', price: 345, category: 'Big bowls', image: image('photo-1547592180-85f173990554', 600), isVeg: true, bestseller: true },
      { id: 'lemon-falafel', name: 'Crispy falafel pita', description: 'Herb falafel, pickled onion, and whipped hummus.', price: 295, category: 'Handhelds', image: image('photo-1529006557810-274b9b2fc783', 600), isVeg: true },
      { id: 'lemon-chicken', name: 'Sumac chicken plate', description: 'Grilled chicken, lemon rice, and cucumber yogurt.', price: 425, category: 'Big bowls', image: image('photo-1547592180-85f173990554', 600), isVeg: false },
    ],
  },
  {
    id: 'dough-and-co',
    name: 'Dough & Co.',
    cuisine: ['Italian', 'Pizza'],
    rating: 4.7,
    deliveryTime: '30–35 min',
    priceForTwo: 700,
    offer: 'Flat ₹100 off',
    image: image('photo-1513104890138-7c749659a591'),
    address: 'HSR Layout, Bengaluru',
    description: 'Long-fermented dough, blistered crusts, and unapologetically good cheese.',
    menu: [
      { id: 'dough-margherita', name: 'Margherita, the proper one', description: 'San Marzano tomato, fior di latte, basil.', price: 425, category: 'Wood-fired pizza', image: image('photo-1513104890138-7c749659a591', 600), isVeg: true, bestseller: true },
      { id: 'dough-funghi', name: 'Wild mushroom', description: 'Roasted mushrooms, taleggio, thyme, black pepper.', price: 510, category: 'Wood-fired pizza', image: image('photo-1571407970349-bc81e7e96d47', 600), isVeg: true },
      { id: 'dough-tiramisu', name: 'Classic tiramisu', description: 'Espresso-soaked sponge, mascarpone, cocoa.', price: 240, category: 'Something sweet', image: image('photo-1571877227200-a0d98ea607e9', 600), isVeg: true },
    ],
  },
  {
    id: 'wok-this-way',
    name: 'Wok This Way',
    cuisine: ['Asian', 'Chinese'],
    rating: 4.5,
    deliveryTime: '25–30 min',
    priceForTwo: 550,
    offer: '15% off your order',
    image: image('photo-1512058564366-18510be2db19'),
    address: 'Jayanagar, Bengaluru',
    description: 'High-heat wok cooking with house-made sauces and plenty of crunch.',
    menu: [
      { id: 'wok-noodles', name: 'Chilli garlic noodles', description: 'Wok-tossed noodles, greens, sesame, and house chilli oil.', price: 285, category: 'Wok favourites', image: image('photo-1512058564366-18510be2db19', 600), isVeg: true, bestseller: true },
      { id: 'wok-rice', name: 'Crispy tofu rice bowl', description: 'Golden tofu, jasmine rice, pickled vegetables.', price: 320, category: 'Rice bowls', image: image('photo-1512621776951-a57141f2eefd', 600), isVeg: true },
      { id: 'wok-chicken', name: 'Sichuan pepper chicken', description: 'Crisp chicken, roasted pepper, spring onion.', price: 390, category: 'Wok favourites', image: image('photo-1525755662778-989d0524087e', 600), isVeg: false },
    ],
  },
  {
    id: 'bun-me-up',
    name: 'Bun Me Up',
    cuisine: ['Burgers', 'American'],
    rating: 4.4,
    deliveryTime: '20–25 min',
    priceForTwo: 500,
    offer: 'Free side with ₹499',
    image: image('photo-1568901346375-23c9450c58cd'),
    address: 'Whitefield, Bengaluru',
    description: 'Smash burgers, crisp edges, soft buns. Napkins very much included.',
    menu: [
      { id: 'bun-classic', name: 'The classic smash', description: 'Double patty, American cheese, house sauce, soft potato bun.', price: 365, category: 'Smash burgers', image: image('photo-1568901346375-23c9450c58cd', 600), isVeg: false, bestseller: true },
      { id: 'bun-shroom', name: 'Shroom & Swiss', description: 'Crispy portobello, Swiss cheese, garlic aioli.', price: 335, category: 'Smash burgers', image: image('photo-1553979459-d2229ba7433a', 600), isVeg: true },
      { id: 'bun-fries', name: 'Rosemary shoestring fries', description: 'Thin-cut fries tossed with rosemary salt.', price: 165, category: 'Sides', image: image('photo-1573080496219-bb080dd4f877', 600), isVeg: true },
    ],
  },
  {
    id: 'sunday-sourdough',
    name: 'Sunday Sourdough',
    cuisine: ['Cafe', 'Bakery'],
    rating: 4.9,
    deliveryTime: '15–20 min',
    priceForTwo: 400,
    offer: 'Breakfast all day',
    image: image('photo-1509440159596-0249088772ff'),
    address: 'Malleshwaram, Bengaluru',
    description: 'Small-batch bread, slow mornings, and excellent coffee.',
    menu: [
      { id: 'sunday-avocado', name: 'Avocado sourdough toast', description: 'Whipped feta, chilli crisp, lemon, seeded sourdough.', price: 310, category: 'All-day brunch', image: image('photo-1525351484163-7529414344d8', 600), isVeg: true, bestseller: true },
      { id: 'sunday-pancakes', name: 'Brown butter pancakes', description: 'Three fluffy pancakes, maple, seasonal fruit.', price: 280, category: 'All-day brunch', image: image('photo-1528207776546-365bb710ee93', 600), isVeg: true },
      { id: 'sunday-coffee', name: 'Iced oat latte', description: 'Double espresso over oat milk and ice.', price: 190, category: 'Coffee & tea', image: image('photo-1461023058943-07fcbe16d735', 600), isVeg: true },
    ],
  },
]

export const cuisines = ['All', 'North Indian', 'Mediterranean', 'Italian', 'Asian', 'Burgers', 'Cafe']

export function findRestaurant(id) {
  return restaurants.find((restaurant) => restaurant.id === id)
}
