const fs = require('fs');
const https = require('https');

function download(url) {
  return new Promise((resolve) => {
    https.get(url, (res) => {
      let d = '';
      res.on('data', c => d += c);
      res.on('end', () => resolve(JSON.parse(d)));
    });
  });
}

const NAME_MAP = {
  "Comilla": "Cumilla",
  "Bogra": "Bogura",
  "Chittagong": "Chattogram",
  "Barisal": "Barishal"
};

async function run() {
  const distData = await download('https://raw.githubusercontent.com/nuhil/bangladesh-geocode/master/districts/districts.json');
  const upZData = await download('https://raw.githubusercontent.com/nuhil/bangladesh-geocode/master/upazilas/upazilas.json');
  
  const distMap = {};
  distData[2].data.forEach(d => {
    distMap[d.id] = NAME_MAP[d.name] || d.name; // English name normalized
  });

  const upazilasByDist = {};
  upZData[2].data.forEach(u => {
    const distName = distMap[u.district_id];
    if (distName) {
      if (!upazilasByDist[distName]) upazilasByDist[distName] = [];
      upazilasByDist[distName].push(u.name);
    }
  });

  const outPath = './src/lib/upazilas.ts';
  const outData = `export const UPAZILAS: Record<string, string[]> = ${JSON.stringify(upazilasByDist, null, 2)};\n`;
  fs.writeFileSync(outPath, outData);
  console.log('Saved to src/lib/upazilas.ts');
}

run();
