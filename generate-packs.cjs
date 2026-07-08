const fs = require('fs')
const path = require('path')

const pack1 = [
  'Apple','Bridge','Castle','Dragon','Engine','Forest','Garden','Harbor','Island','Jungle',
  'Knight','Lemon','Market','Newton','Ocean','Palace','Quilt','Robot','School','Temple',
  'Unicorn','Valley','Window','Yellow','Zebra','Anchor','Battery','Candle','Desert','Eagle',
  'Feather','Guitar','Hammer','Igloo','Jacket','Kangaroo','Ladder','Mirror','Needle','Orange',
  'Pencil','Quiver','Rocket','Shield','Tunnel','Umbrella','Violin','Wallet','Xylophone','Yacht',
  'Acorn','Basket','Camera','Diamond','Elephant','Fan','Globe','Helmet','Iceberg','Jar',
  'Key','Lamp','Map','Net','Owl','Pipe','Ring','Star','Telescope','Uniform',
  'Vase','Whale','Box','Yarn','Zipper','Alarm','Bell','Crown','Door','Egg',
  'Fence','Ghost','Hat','Ink','Jewel','Kite','Lock','Moon','Nail','Oven',
  'Paint','Quill','Rope','Sock','Tree','Unit','Vine','Web','Axe','Yolk'
]

const pack2 = [
  'Time','Love','Dream','Hope','Fear','Power','Magic','Luck','Peace','War',
  'Life','Death','Truth','Lie','Honor','Shame','Pride','Guilt','Joy','Sorrow',
  'Faith','Doubt','Chaos','Order','Light','Dark','Sound','Silence','Heat','Cold',
  'Speed','Slow','High','Low','Near','Far','Old','New','Rich','Poor',
  'Wise','Fool','Brave','Weak','Strong','Soft','Hard','Smooth','Rough','Clean',
  'Dirty','Safe','Risk','Free','Bound','Open','Shut','Full','Empty','Wet',
  'Dry','Deep','Shallow','Wide','Narrow','Long','Short','Heavy','Slight','Bright',
  'Dim','Loud','Quiet','Sweet','Sour','Bitter','Spicy','Fresh','Stale','Raw',
  'Cooked','Bent','Straight','Curved','Flat','Round','Square','Sharp','Blunt','Thin',
  'Thick','Solid','Liquid','Gas','Past','Future','Now','Always','Never','Often'
]

const pack3 = [
  'Run','Jump','Swim','Fly','Dance','Sing','Read','Write','Draw','Build',
  'Break','Fix','Cook','Eat','Drink','Sleep','Wake','Walk','Ride','Drive',
  'Throw','Catch','Kick','Punch','Push','Pull','Lift','Drop','Turn','Spin',
  'Roll','Bounce','Slide','Climb','Fall','Rise','Grow','Shrink','Expand','Compress',
  'Begin','End','Start','Stop','Pause','Play','Work','Rest','Fight','Hug',
  'Kiss','Bite','Scratch','Cut','Sew','Knit','Weave','Braid','Tie','Untie',
  'Glue','Tape','Fold','Unfold','Wrap','Unwrap','Pack','Unpack','Load','Unload',
  'Latch','Unlock','Enter','Exit','Arrive','Leave','Come','Go','Send','Receive',
  'Give','Take','Buy','Sell','Pay','Earn','Save','Spend','Win','Lose',
  'Find','Hide','Seek','Chase','Flee','Follow','Lead','Gather','Scatter','Split'
]

const pack4 = [
  'City','Town','Village','Farm','Ranch','Beach','Coast','Lake','River','Stream',
  'Pond','Well','Spring','Waterfall','Mountain','Hill','Cliff','Cave','Volcano','Canyon',
  'Plain','Prairie','Savanna','Tundra','Glacier','Reef','Delta','Bay','Gulf','Strait',
  'Peninsula','Cape','Port','Dock','Pier','Marina','Haven','Canal','Channel','Passage',
  'Archway','Dam','Mill','Mine','Quarry','Pit','Field','Meadow','Pasture','Orchard',
  'Vineyard','Courtyard','Park','Yard','Court','Plaza','Block','Avenue','Street','Road',
  'Highway','Trail','Path','Track','Route','Course','Circuit','Orbit','Zone','Region',
  'Area','Sector','District','Ward','Neighborhood','Suburb','Downtown','Uptown','Midtown','Outskirts',
  'Border','Boundary','Edge','Limit','Frontier','Horizon','Skyline','Landscape','Terrain','Soil',
  'Sand','Clay','Mud','Dust','Gravel','Pebble','Stone','Rock','Boulder','Crystal'
]

const pack5 = [
  'Book','Page','Cover','Spine','Paper','Card','Board','Tile','Slab','Panel',
  'Screen','Monitor','Phone','Tablet','Laptop','Keyboard','Mouse','Cable','Cord','Wire',
  'Chain','Link','Hook','Eyelet','Loop','Knot','Ball','Cube','Sphere','Cone',
  'Cylinder','Pyramid','Prism','Arch','Dome','Vault','Tower','Spire','Chimney','Roof',
  'Wall','Floor','Ceiling','Stair','Step','Ledge','Shelf','Rack','Stand','Frame',
  'Pole','Rod','Bar','Beam','Girder','Column','Pillar','Post','Stake','Peg',
  'Pin','Spike','Screw','Rivet','Nut','Washer','Coil','Gear','Wheel','Axle',
  'Pedal','Lever','Handle','Grip','Strap','Belt','Buckle','Snap','Clip','Clamp',
  'Vise','Tool','Machine','Motor','Pump','Valve','Gauge','Meter','Scale','Balance',
  'Weight','Mass','Volume','Space','Room','Hall','Lobby','Chamber','Cellar','Attic'
]

const allWords = [...pack1, ...pack2, ...pack3, ...pack4, ...pack5]
const uniqueWords = new Set(allWords.map(w => w.toLowerCase()))

if (uniqueWords.size !== 500) {
  console.error(`Expected 500 unique words, got ${uniqueWords.size}`)
  // Find duplicates
  const seen = new Set()
  const dups = new Set()
  for (const w of allWords) {
    const l = w.toLowerCase()
    if (seen.has(l)) dups.add(l)
    seen.add(l)
  }
  console.error('Duplicates:', [...dups])
  process.exit(1)
}

const packsDir = path.join(__dirname, 'src', 'packs')
fs.mkdirSync(packsDir, { recursive: true })

const packs = [pack1, pack2, pack3, pack4, pack5]
packs.forEach((pack, i) => {
  const num = i + 1
  const content = `export const pack${num} = {
  id: 'pack${num}',
  name: 'Pack ${num}',
  words: ${JSON.stringify(pack, null, 2)},
}
`
  fs.writeFileSync(path.join(packsDir, `pack${num}.ts`), content)
})

const indexContent = `import { pack1 } from './pack1'
import { pack2 } from './pack2'
import { pack3 } from './pack3'
import { pack4 } from './pack4'
import { pack5 } from './pack5'

export const allPacks = [pack1, pack2, pack3, pack4, pack5]

export interface WordPack {
  id: string
  name: string
  words: string[]
}

export function getActiveWords(packIds: string[]): string[] {
  const seen = new Set<string>()
  const result: string[] = []

  for (const pack of allPacks) {
    if (!packIds.includes(pack.id)) continue
    for (const word of pack.words) {
      const lower = word.toLowerCase()
      if (!seen.has(lower)) {
        seen.add(lower)
        result.push(word)
      }
    }
  }

  return result
}
`
fs.writeFileSync(path.join(packsDir, 'index.ts'), indexContent)

console.log('Created 5 word packs in src/packs/')
console.log(`Total unique words: ${uniqueWords.size}`)
