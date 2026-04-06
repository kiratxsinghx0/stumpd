import { fetchPlayers, fetchPlayerCount } from "../services/ipl-api";

export type IplPlayerRow = {
  name: string;
  meta: { shortened: boolean; fullName: string };
};

const LS_PLAYER_COUNT_KEY = "stumpd-ipl-puzzle-count";

/**
 * Fetches the player count from the API, compares with the locally stored
 * count, and only fetches the full player list when the count has changed.
 * Returns `null` when the hardcoded data is still up-to-date.
 */
export async function fetchIplPlayersFromAPI(): Promise<IplPlayerRow[] | null> {
  const apiCount = await fetchPlayerCount();

  let storedCount: number | null = null;
  try {
    const raw = localStorage.getItem(LS_PLAYER_COUNT_KEY);
    if (raw != null) storedCount = parseInt(raw, 10);
  } catch { /* SSR / private mode */ }

  if (storedCount === apiCount) return null;

  const res = await fetchPlayers();
  if (!res.ok) throw new Error(`Failed to fetch IPL players: ${res.status}`);
  const json = await res.json();
  const rows: unknown[] = json.data ?? [];

  try {
    localStorage.setItem(LS_PLAYER_COUNT_KEY, String(apiCount));
  } catch { /* quota / private mode */ }

  return rows.map((r: any) => ({
    name: r.name,
    meta: {
      shortened: Boolean(r.is_shortened),
      fullName: r.full_name,
    },
  }));
}

export const iplPlayers: IplPlayerRow[] = [
  { "name": "MS", "meta": {"shortened":false,"fullName":"MS Dhoni"} },
  { "name": "DHONI", "meta": {"shortened":false,"fullName":"MS Dhoni"} },
  { "name": "SACHI", "meta": {"shortened":true,"fullName":"Sachin Tendulkar"} },
  { "name": "TENDU", "meta": {"shortened":true,"fullName":"Sachin Tendulkar"} },
  { "name": "SOURA", "meta": {"shortened":true,"fullName":"Sourav Ganguly"} },
  { "name": "GANGU", "meta": {"shortened":true,"fullName":"Sourav Ganguly"} },
  { "name": "RAHUL", "meta": {"shortened":false,"fullName":"Rahul Dravid"} },
  { "name": "DRAVI", "meta": {"shortened":true,"fullName":"Rahul Dravid"} },
  { "name": "JASPR", "meta": {"shortened":true,"fullName":"Jasprit Bumrah"} },
  { "name": "BUMRA", "meta": {"shortened":true,"fullName":"Jasprit Bumrah"} },
  { "name": "RAVIN", "meta": {"shortened":true,"fullName":"Ravindra Jadeja"} },
  { "name": "JADEJ", "meta": {"shortened":true,"fullName":"Ravindra Jadeja"} },
  { "name": "YUZVE", "meta": {"shortened":true,"fullName":"Yuzvendra Chahal"} },
  { "name": "CHAHA", "meta": {"shortened":true,"fullName":"Yuzvendra Chahal"} },
  { "name": "RISHA", "meta": {"shortened":true,"fullName":"Rishabh Pant"} },
  { "name": "PANT", "meta": {"shortened":false,"fullName":"Rishabh Pant"} },
  { "name": "ROHIT", "meta": {"shortened":false,"fullName":"Rohit Sharma"} },
  { "name": "SHARM", "meta": {"shortened":true,"fullName":"Rohit Sharma"} },
  { "name": "VIREN", "meta": {"shortened":true,"fullName":"Virender Sehwag"} },
  { "name": "SEHWA", "meta": {"shortened":true,"fullName":"Virender Sehwag"} },
  { "name": "YUVRA", "meta": {"shortened":true,"fullName":"Yuvraj Singh"} },
  { "name": "SINGH", "meta": {"shortened":false,"fullName":"Yuvraj Singh"} },
  { "name": "SURES", "meta": {"shortened":true,"fullName":"Suresh Raina"} },
  { "name": "RAINA", "meta": {"shortened":false,"fullName":"Suresh Raina"} },
  { "name": "GAUTA", "meta": {"shortened":true,"fullName":"Gautam Gambhir"} },
  { "name": "GAMBH", "meta": {"shortened":true,"fullName":"Gautam Gambhir"} },
  { "name": "SHIKH", "meta": {"shortened":true,"fullName":"Shikhar Dhawan"} },
  { "name": "DHAWA", "meta": {"shortened":true,"fullName":"Shikhar Dhawan"} },
  { "name": "KL", "meta": {"shortened":false,"fullName":"KL Rahul"} },
  { "name": "RAHUL", "meta": {"shortened":false,"fullName":"KL Rahul"} },
  { "name": "AJINK", "meta": {"shortened":true,"fullName":"Ajinkya Rahane"} },
  { "name": "RAHAN", "meta": {"shortened":true,"fullName":"Ajinkya Rahane"} },
  { "name": "CHETE", "meta": {"shortened":true,"fullName":"Cheteshwar Pujara"} },
  { "name": "PUJAR", "meta": {"shortened":true,"fullName":"Cheteshwar Pujara"} },
  { "name": "HARDI", "meta": {"shortened":true,"fullName":"Hardik Pandya"} },
  { "name": "PANDY", "meta": {"shortened":true,"fullName":"Hardik Pandya"} },
  { "name": "SURYA", "meta": {"shortened":true,"fullName":"Suryakumar Yadav"} },
  { "name": "YADAV", "meta": {"shortened":false,"fullName":"Suryakumar Yadav"} },
  { "name": "MOHAM", "meta": {"shortened":true,"fullName":"Mohammed Shami"} },
  { "name": "SHAMI", "meta": {"shortened":false,"fullName":"Mohammed Shami"} },
  { "name": "RAVIC", "meta": {"shortened":true,"fullName":"Ravichandran Ashwin"} },
  { "name": "ASHWI", "meta": {"shortened":true,"fullName":"Ravichandran Ashwin"} },
  { "name": "ISHAN", "meta": {"shortened":false,"fullName":"Ishan Kishan"} },
  { "name": "KISHA", "meta": {"shortened":true,"fullName":"Ishan Kishan"} },
  { "name": "SANJU", "meta": {"shortened":false,"fullName":"Sanju Samson"} },
  { "name": "SAMSO", "meta": {"shortened":true,"fullName":"Sanju Samson"} },
  { "name": "RINKU", "meta": {"shortened":false,"fullName":"Rinku Singh"} },
  { "name": "SINGH", "meta": {"shortened":false,"fullName":"Rinku Singh"} },
  { "name": "TILAK", "meta": {"shortened":false,"fullName":"Tilak Varma"} },
  { "name": "VARMA", "meta": {"shortened":false,"fullName":"Tilak Varma"} },
  { "name": "YASHA", "meta": {"shortened":true,"fullName":"Yashasvi Jaiswal"} },
  { "name": "JAISW", "meta": {"shortened":true,"fullName":"Yashasvi Jaiswal"} },
  { "name": "SHUBM", "meta": {"shortened":true,"fullName":"Shubman Gill"} },
  { "name": "GILL", "meta": {"shortened":false,"fullName":"Shubman Gill"} },
  { "name": "DEEPA", "meta": {"shortened":true,"fullName":"Deepak Chahar"} },
  { "name": "CHAHA", "meta": {"shortened":true,"fullName":"Deepak Chahar"} },
  { "name": "KULDE", "meta": {"shortened":true,"fullName":"Kuldeep Yadav"} },
  { "name": "YADAV", "meta": {"shortened":false,"fullName":"Kuldeep Yadav"} },
  { "name": "ARSHD", "meta": {"shortened":true,"fullName":"Arshdeep Singh"} },
  { "name": "SINGH", "meta": {"shortened":false,"fullName":"Arshdeep Singh"} },
  { "name": "MOHAM", "meta": {"shortened":true,"fullName":"Mohammed Siraj"} },
  { "name": "SIRAJ", "meta": {"shortened":false,"fullName":"Mohammed Siraj"} },
  { "name": "AXAR", "meta": {"shortened":false,"fullName":"Axar Patel"} },
  { "name": "PATEL", "meta": {"shortened":false,"fullName":"Axar Patel"} },
  { "name": "RUTUR", "meta": {"shortened":true,"fullName":"Ruturaj Gaikwad"} },
  { "name": "GAIKW", "meta": {"shortened":true,"fullName":"Ruturaj Gaikwad"} },
  { "name": "DINES", "meta": {"shortened":true,"fullName":"Dinesh Karthik"} },
  { "name": "KARTH", "meta": {"shortened":true,"fullName":"Dinesh Karthik"} },
  { "name": "IRFAN", "meta": {"shortened":false,"fullName":"Irfan Pathan"} },
  { "name": "PATHA", "meta": {"shortened":true,"fullName":"Irfan Pathan"} },
  { "name": "VIRAT", "meta": {"shortened":false,"fullName":"Virat Kohli"} },
  { "name": "KOHLI", "meta": {"shortened":false,"fullName":"Virat Kohli"} },
  { "name": "ANIL", "meta": {"shortened":false,"fullName":"Anil Kumble"} },
  { "name": "KUMBL", "meta": {"shortened":true,"fullName":"Anil Kumble"} },
  { "name": "ZAHEE", "meta": {"shortened":true,"fullName":"Zaheer Khan"} },
  { "name": "KHAN", "meta": {"shortened":false,"fullName":"Zaheer Khan"} },
  { "name": "HARBH", "meta": {"shortened":true,"fullName":"Harbhajan Singh"} },
  { "name": "SINGH", "meta": {"shortened":false,"fullName":"Harbhajan Singh"} },
  { "name": "KAPIL", "meta": {"shortened":false,"fullName":"Kapil Dev"} },
  { "name": "DEV", "meta": {"shortened":false,"fullName":"Kapil Dev"} },
  { "name": "SUNIL", "meta": {"shortened":false,"fullName":"Sunil Gavaskar"} },
  { "name": "GAVAS", "meta": {"shortened":true,"fullName":"Sunil Gavaskar"} },
  { "name": "VVS", "meta": {"shortened":false,"fullName":"VVS Laxman"} },
  { "name": "LAXMA", "meta": {"shortened":true,"fullName":"VVS Laxman"} },
  { "name": "STEVE", "meta": {"shortened":false,"fullName":"Steve Smith"} },
  { "name": "SMITH", "meta": {"shortened":false,"fullName":"Steve Smith"} },
  { "name": "DAVID", "meta": {"shortened":false,"fullName":"David Warner"} },
  { "name": "WARNE", "meta": {"shortened":true,"fullName":"David Warner"} },
  { "name": "PAT", "meta": {"shortened":false,"fullName":"Pat Cummins"} },
  { "name": "CUMMI", "meta": {"shortened":true,"fullName":"Pat Cummins"} },
  { "name": "RICKY", "meta": {"shortened":false,"fullName":"Ricky Ponting"} },
  { "name": "PONTI", "meta": {"shortened":true,"fullName":"Ricky Ponting"} },
  { "name": "SHANE", "meta": {"shortened":false,"fullName":"Shane Warne"} },
  { "name": "WARNE", "meta": {"shortened":false,"fullName":"Shane Warne"} },
  { "name": "ADAM", "meta": {"shortened":false,"fullName":"Adam Gilchrist"} },
  { "name": "GILCH", "meta": {"shortened":true,"fullName":"Adam Gilchrist"} },
  { "name": "MITCH", "meta": {"shortened":true,"fullName":"Mitchell Starc"} },
  { "name": "STARC", "meta": {"shortened":false,"fullName":"Mitchell Starc"} },
  { "name": "TRAVI", "meta": {"shortened":true,"fullName":"Travis Head"} },
  { "name": "HEAD", "meta": {"shortened":false,"fullName":"Travis Head"} },
  { "name": "MATTH", "meta": {"shortened":true,"fullName":"Matthew Hayden"} },
  { "name": "HAYDE", "meta": {"shortened":true,"fullName":"Matthew Hayden"} },
  { "name": "MITCH", "meta": {"shortened":true,"fullName":"Mitchell Johnson"} },
  { "name": "JOHNS", "meta": {"shortened":true,"fullName":"Mitchell Johnson"} },
  { "name": "GLENN", "meta": {"shortened":false,"fullName":"Glenn McGrath"} },
  { "name": "MCGRA", "meta": {"shortened":true,"fullName":"Glenn McGrath"} },
  { "name": "JOSH", "meta": {"shortened":false,"fullName":"Josh Hazlewood"} },
  { "name": "HAZLE", "meta": {"shortened":true,"fullName":"Josh Hazlewood"} },
  { "name": "CAMER", "meta": {"shortened":true,"fullName":"Cameron Green"} },
  { "name": "GREEN", "meta": {"shortened":false,"fullName":"Cameron Green"} },
  { "name": "JOE", "meta": {"shortened":false,"fullName":"Joe Root"} },
  { "name": "ROOT", "meta": {"shortened":false,"fullName":"Joe Root"} },
  { "name": "BEN", "meta": {"shortened":false,"fullName":"Ben Stokes"} },
  { "name": "STOKE", "meta": {"shortened":true,"fullName":"Ben Stokes"} },
  { "name": "JAMES", "meta": {"shortened":false,"fullName":"James Anderson"} },
  { "name": "ANDER", "meta": {"shortened":true,"fullName":"James Anderson"} },
  { "name": "STUAR", "meta": {"shortened":true,"fullName":"Stuart Broad"} },
  { "name": "BROAD", "meta": {"shortened":false,"fullName":"Stuart Broad"} },
  { "name": "KEVIN", "meta": {"shortened":false,"fullName":"Kevin Pietersen"} },
  { "name": "PIETE", "meta": {"shortened":true,"fullName":"Kevin Pietersen"} },
  { "name": "JOFRA", "meta": {"shortened":false,"fullName":"Jofra Archer"} },
  { "name": "ARCHE", "meta": {"shortened":true,"fullName":"Jofra Archer"} },
  { "name": "ANDRE", "meta": {"shortened":true,"fullName":"Andrew Flintoff"} },
  { "name": "FLINT", "meta": {"shortened":true,"fullName":"Andrew Flintoff"} },
  { "name": "JONNY", "meta": {"shortened":false,"fullName":"Jonny Bairstow"} },
  { "name": "BAIRS", "meta": {"shortened":true,"fullName":"Jonny Bairstow"} },
  { "name": "HARRY", "meta": {"shortened":false,"fullName":"Harry Brook"} },
  { "name": "BROOK", "meta": {"shortened":false,"fullName":"Harry Brook"} },
  { "name": "CHRIS", "meta": {"shortened":false,"fullName":"Chris Gayle"} },
  { "name": "GAYLE", "meta": {"shortened":false,"fullName":"Chris Gayle"} },
  { "name": "BRIAN", "meta": {"shortened":false,"fullName":"Brian Lara"} },
  { "name": "LARA", "meta": {"shortened":false,"fullName":"Brian Lara"} },
  { "name": "KIERO", "meta": {"shortened":true,"fullName":"Kieron Pollard"} },
  { "name": "POLLA", "meta": {"shortened":true,"fullName":"Kieron Pollard"} },
  { "name": "ANDRE", "meta": {"shortened":false,"fullName":"Andre Russell"} },
  { "name": "RUSSE", "meta": {"shortened":true,"fullName":"Andre Russell"} },
  { "name": "DWAYN", "meta": {"shortened":true,"fullName":"Dwayne Bravo"} },
  { "name": "BRAVO", "meta": {"shortened":false,"fullName":"Dwayne Bravo"} },
  { "name": "SUNIL", "meta": {"shortened":false,"fullName":"Sunil Narine"} },
  { "name": "NARIN", "meta": {"shortened":true,"fullName":"Sunil Narine"} },
  { "name": "VIVIA", "meta": {"shortened":true,"fullName":"Vivian Richards"} },
  { "name": "RICHA", "meta": {"shortened":true,"fullName":"Vivian Richards"} },
  { "name": "NICHO", "meta": {"shortened":true,"fullName":"Nicholas Pooran"} },
  { "name": "POORA", "meta": {"shortened":true,"fullName":"Nicholas Pooran"} },
  { "name": "DALE", "meta": {"shortened":false,"fullName":"Dale Steyn"} },
  { "name": "STEYN", "meta": {"shortened":false,"fullName":"Dale Steyn"} },
  { "name": "JACQU", "meta": {"shortened":true,"fullName":"Jacques Kallis"} },
  { "name": "KALLI", "meta": {"shortened":true,"fullName":"Jacques Kallis"} },
  { "name": "KAGIS", "meta": {"shortened":true,"fullName":"Kagiso Rabada"} },
  { "name": "RABAD", "meta": {"shortened":true,"fullName":"Kagiso Rabada"} },
  { "name": "AB", "meta": {"shortened":false,"fullName":"AB de Villiers"} },
  { "name": "DEVIL", "meta": {"shortened":true,"fullName":"AB de Villiers"} },
  { "name": "QUINT", "meta": {"shortened":true,"fullName":"Quinton de Kock"} },
  { "name": "DE KO", "meta": {"shortened":true,"fullName":"Quinton de Kock"} },
  { "name": "DAVID", "meta": {"shortened":false,"fullName":"David Miller"} },
  { "name": "MILLE", "meta": {"shortened":true,"fullName":"David Miller"} },
  { "name": "TEMBA", "meta": {"shortened":false,"fullName":"Temba Bavuma"} },
  { "name": "BAVUM", "meta": {"shortened":true,"fullName":"Temba Bavuma"} },
  { "name": "FAF", "meta": {"shortened":false,"fullName":"Faf du Plessis"} },
  { "name": "DU PL", "meta": {"shortened":true,"fullName":"Faf du Plessis"} },
  { "name": "KANE", "meta": {"shortened":false,"fullName":"Kane Williamson"} },
  { "name": "WILLI", "meta": {"shortened":true,"fullName":"Kane Williamson"} },
  { "name": "BREND", "meta": {"shortened":true,"fullName":"Brendon McCullum"} },
  { "name": "MCCUL", "meta": {"shortened":true,"fullName":"Brendon McCullum"} },
  { "name": "TRENT", "meta": {"shortened":false,"fullName":"Trent Boult"} },
  { "name": "BOULT", "meta": {"shortened":false,"fullName":"Trent Boult"} },
  { "name": "MARTI", "meta": {"shortened":true,"fullName":"Martin Guptill"} },
  { "name": "GUPTI", "meta": {"shortened":true,"fullName":"Martin Guptill"} },
  { "name": "DEVON", "meta": {"shortened":false,"fullName":"Devon Conway"} },
  { "name": "CONWA", "meta": {"shortened":true,"fullName":"Devon Conway"} },
  { "name": "KUMAR", "meta": {"shortened":false,"fullName":"Kumar Sangakkara"} },
  { "name": "SANGA", "meta": {"shortened":true,"fullName":"Kumar Sangakkara"} },
  { "name": "MAHEL", "meta": {"shortened":true,"fullName":"Mahela Jayawardena"} },
  { "name": "JAYAW", "meta": {"shortened":true,"fullName":"Mahela Jayawardena"} },
  { "name": "MUTTI", "meta": {"shortened":true,"fullName":"Muttiah Muralitharan"} },
  { "name": "MURAL", "meta": {"shortened":true,"fullName":"Muttiah Muralitharan"} },
  { "name": "LASIT", "meta": {"shortened":true,"fullName":"Lasith Malinga"} },
  { "name": "MALIN", "meta": {"shortened":true,"fullName":"Lasith Malinga"} },
  { "name": "WANIN", "meta": {"shortened":true,"fullName":"Wanindu Hasaranga"} },
  { "name": "HASAR", "meta": {"shortened":true,"fullName":"Wanindu Hasaranga"} },
  { "name": "TILLA", "meta": {"shortened":true,"fullName":"Tillakaratne Dilshan"} },
  { "name": "DILSH", "meta": {"shortened":true,"fullName":"Tillakaratne Dilshan"} },
  { "name": "SHAKI", "meta": {"shortened":true,"fullName":"Shakib Al Hasan"} },
  { "name": "AL HA", "meta": {"shortened":true,"fullName":"Shakib Al Hasan"} },
  { "name": "TAMIM", "meta": {"shortened":false,"fullName":"Tamim Iqbal"} },
  { "name": "IQBAL", "meta": {"shortened":false,"fullName":"Tamim Iqbal"} },
  { "name": "MUSHF", "meta": {"shortened":true,"fullName":"Mushfiqur Rahim"} },
  { "name": "RAHIM", "meta": {"shortened":false,"fullName":"Mushfiqur Rahim"} },
  { "name": "MUSTA", "meta": {"shortened":true,"fullName":"Mustafizur Rahman"} },
  { "name": "RAHMA", "meta": {"shortened":true,"fullName":"Mustafizur Rahman"} },
  { "name": "BABAR", "meta": {"shortened":false,"fullName":"Babar Azam"} },
  { "name": "AZAM", "meta": {"shortened":false,"fullName":"Babar Azam"} },
  { "name": "MOHAM", "meta": {"shortened":true,"fullName":"Mohammad Rizwan"} },
  { "name": "RIZWA", "meta": {"shortened":true,"fullName":"Mohammad Rizwan"} },
  { "name": "SHAHE", "meta": {"shortened":true,"fullName":"Shaheen Afridi"} },
  { "name": "AFRID", "meta": {"shortened":true,"fullName":"Shaheen Afridi"} },
  { "name": "SHAHI", "meta": {"shortened":true,"fullName":"Shahid Afridi"} },
  { "name": "AFRID", "meta": {"shortened":true,"fullName":"Shahid Afridi"} },
  { "name": "SHOAI", "meta": {"shortened":true,"fullName":"Shoaib Akhtar"} },
  { "name": "AKHTA", "meta": {"shortened":true,"fullName":"Shoaib Akhtar"} },
  { "name": "WASIM", "meta": {"shortened":false,"fullName":"Wasim Akram"} },
  { "name": "AKRAM", "meta": {"shortened":false,"fullName":"Wasim Akram"} },
  { "name": "WAQAR", "meta": {"shortened":false,"fullName":"Waqar Younis"} },
  { "name": "YOUNI", "meta": {"shortened":true,"fullName":"Waqar Younis"} },
  { "name": "YOUNI", "meta": {"shortened":true,"fullName":"Younis Khan"} },
  { "name": "KHAN", "meta": {"shortened":false,"fullName":"Younis Khan"} },
  { "name": "FAKHA", "meta": {"shortened":true,"fullName":"Fakhar Zaman"} },
  { "name": "ZAMAN", "meta": {"shortened":false,"fullName":"Fakhar Zaman"} },
  { "name": "SARFA", "meta": {"shortened":true,"fullName":"Sarfaraz Ahmed"} },
  { "name": "AHMED", "meta": {"shortened":false,"fullName":"Sarfaraz Ahmed"} },
  { "name": "RASHI", "meta": {"shortened":true,"fullName":"Rashid Khan"} },
  { "name": "KHAN", "meta": {"shortened":false,"fullName":"Rashid Khan"} },
  { "name": "MUJEE", "meta": {"shortened":true,"fullName":"Mujeeb Ur Rahman"} },
  { "name": "UR RA", "meta": {"shortened":true,"fullName":"Mujeeb Ur Rahman"} },
  { "name": "MOHAM", "meta": {"shortened":true,"fullName":"Mohammed Nabi"} },
  { "name": "NABI", "meta": {"shortened":false,"fullName":"Mohammed Nabi"} },
  { "name": "ANDY", "meta": {"shortened":false,"fullName":"Andy Flower"} },
  { "name": "FLOWE", "meta": {"shortened":true,"fullName":"Andy Flower"} },
  { "name": "BREND", "meta": {"shortened":true,"fullName":"Brendan Taylor"} },
  { "name": "TAYLO", "meta": {"shortened":true,"fullName":"Brendan Taylor"} },
  { "name": "PAUL", "meta": {"shortened":false,"fullName":"Paul Stirling"} },
  { "name": "STIRL", "meta": {"shortened":true,"fullName":"Paul Stirling"} },
    {
      "name": "MOHIN",
      "meta": {
        "shortened": true,
        "fullName": "Mohinder Amarnath"
      }
    },
    {
      "name": "AMARN",
      "meta": {
        "shortened": true,
        "fullName": "Mohinder Amarnath"
      }
    },
    {
      "name": "DILIP",
      "meta": {
        "shortened": false,
        "fullName": "Dilip Vengsarkar"
      }
    },
    {
      "name": "VENGS",
      "meta": {
        "shortened": true,
        "fullName": "Dilip Vengsarkar"
      }
    },
    {
      "name": "GUNDA",
      "meta": {
        "shortened": true,
        "fullName": "Gundappa Viswanath"
      }
    },
    {
      "name": "VISWA",
      "meta": {
        "shortened": true,
        "fullName": "Gundappa Viswanath"
      }
    },
    {
      "name": "SYED",
      "meta": {
        "shortened": false,
        "fullName": "Syed Kirmani"
      }
    },
    {
      "name": "KIRMA",
      "meta": {
        "shortened": true,
        "fullName": "Syed Kirmani"
      }
    },
    {
      "name": "ROGER",
      "meta": {
        "shortened": false,
        "fullName": "Roger Binny"
      }
    },
    {
      "name": "BINNY",
      "meta": {
        "shortened": false,
        "fullName": "Roger Binny"
      }
    },
    {
      "name": "RAVI",
      "meta": {
        "shortened": false,
        "fullName": "Ravi Shastri"
      }
    },
    {
      "name": "SHAST",
      "meta": {
        "shortened": true,
        "fullName": "Ravi Shastri"
      }
    },
    {
      "name": "MADAN",
      "meta": {
        "shortened": false,
        "fullName": "Madan Lal"
      }
    },
    {
      "name": "LAL",
      "meta": {
        "shortened": false,
        "fullName": "Madan Lal"
      }
    },
    {
      "name": "SRINI",
      "meta": {
        "shortened": true,
        "fullName": "Srinivasan Venkataraghavan"
      }
    },
    {
      "name": "VENKA",
      "meta": {
        "shortened": true,
        "fullName": "Srinivasan Venkataraghavan"
      }
    },
    {
      "name": "BISHA",
      "meta": {
        "shortened": true,
        "fullName": "Bishan Singh Bedi"
      }
    },
    {
      "name": "SINGH",
      "meta": {
        "shortened": false,
        "fullName": "Bishan Singh Bedi"
      }
    },
    {
      "name": "BEDI",
      "meta": {
        "shortened": false,
        "fullName": "Bishan Singh Bedi"
      }
    },
    {
      "name": "ERAPA",
      "meta": {
        "shortened": true,
        "fullName": "Erapalli Prasanna"
      }
    },
    {
      "name": "PRASA",
      "meta": {
        "shortened": true,
        "fullName": "Erapalli Prasanna"
      }
    },
    {
      "name": "BHAGW",
      "meta": {
        "shortened": true,
        "fullName": "Bhagwath Chandrasekhar"
      }
    },
    {
      "name": "CHAND",
      "meta": {
        "shortened": true,
        "fullName": "Bhagwath Chandrasekhar"
      }
    },
    {
      "name": "CHETA",
      "meta": {
        "shortened": true,
        "fullName": "Chetan Sharma"
      }
    },
    {
      "name": "SHARM",
      "meta": {
        "shortened": true,
        "fullName": "Chetan Sharma"
      }
    },
    {
      "name": "JAVAG",
      "meta": {
        "shortened": true,
        "fullName": "Javagal Srinath"
      }
    },
    {
      "name": "SRINA",
      "meta": {
        "shortened": true,
        "fullName": "Javagal Srinath"
      }
    },
    {
      "name": "VENKA",
      "meta": {
        "shortened": true,
        "fullName": "Venkatesh Prasad"
      }
    },
    {
      "name": "PRASA",
      "meta": {
        "shortened": true,
        "fullName": "Venkatesh Prasad"
      }
    },
    {
      "name": "NAYAN",
      "meta": {
        "shortened": false,
        "fullName": "Nayan Mongia"
      }
    },
    {
      "name": "MONGI",
      "meta": {
        "shortened": true,
        "fullName": "Nayan Mongia"
      }
    },
    {
      "name": "SAURA",
      "meta": {
        "shortened": true,
        "fullName": "Saurav Ganguly"
      }
    },
    {
      "name": "GANGU",
      "meta": {
        "shortened": true,
        "fullName": "Saurav Ganguly"
      }
    },
    {
      "name": "AJAY",
      "meta": {
        "shortened": false,
        "fullName": "Ajay Jadeja"
      }
    },
    {
      "name": "JADEJ",
      "meta": {
        "shortened": true,
        "fullName": "Ajay Jadeja"
      }
    },
    {
      "name": "VINOD",
      "meta": {
        "shortened": false,
        "fullName": "Vinod Kambli"
      }
    },
    {
      "name": "KAMBL",
      "meta": {
        "shortened": true,
        "fullName": "Vinod Kambli"
      }
    },
    {
      "name": "AZHAR",
      "meta": {
        "shortened": true,
        "fullName": "Azharuddin Mohammed"
      }
    },
    {
      "name": "MOHAM",
      "meta": {
        "shortened": true,
        "fullName": "Azharuddin Mohammed"
      }
    },
    {
      "name": "NAVJO",
      "meta": {
        "shortened": true,
        "fullName": "Navjot Sidhu"
      }
    },
    {
      "name": "SIDHU",
      "meta": {
        "shortened": false,
        "fullName": "Navjot Sidhu"
      }
    },
    {
      "name": "AMOL",
      "meta": {
        "shortened": false,
        "fullName": "Amol Muzumdar"
      }
    },
    {
      "name": "MUZUM",
      "meta": {
        "shortened": true,
        "fullName": "Amol Muzumdar"
      }
    },
    {
      "name": "SREES",
      "meta": {
        "shortened": true,
        "fullName": "Sreesanth"
      }
    },
    {
      "name": "RP",
      "meta": {
        "shortened": false,
        "fullName": "RP Singh"
      }
    },
    {
      "name": "SINGH",
      "meta": {
        "shortened": false,
        "fullName": "RP Singh"
      }
    },
    {
      "name": "MUNAF",
      "meta": {
        "shortened": false,
        "fullName": "Munaf Patel"
      }
    },
    {
      "name": "PATEL",
      "meta": {
        "shortened": false,
        "fullName": "Munaf Patel"
      }
    },
    {
      "name": "PRAGY",
      "meta": {
        "shortened": true,
        "fullName": "Pragyan Ojha"
      }
    },
    {
      "name": "OJHA",
      "meta": {
        "shortened": false,
        "fullName": "Pragyan Ojha"
      }
    },
    {
      "name": "ASHIS",
      "meta": {
        "shortened": true,
        "fullName": "Ashish Nehra"
      }
    },
    {
      "name": "NEHRA",
      "meta": {
        "shortened": false,
        "fullName": "Ashish Nehra"
      }
    },
    {
      "name": "VRV",
      "meta": {
        "shortened": false,
        "fullName": "VRV Singh"
      }
    },
    {
      "name": "SINGH",
      "meta": {
        "shortened": false,
        "fullName": "VRV Singh"
      }
    },
    {
      "name": "PIYUS",
      "meta": {
        "shortened": true,
        "fullName": "Piyush Chawla"
      }
    },
    {
      "name": "CHAWL",
      "meta": {
        "shortened": true,
        "fullName": "Piyush Chawla"
      }
    },
    {
      "name": "BADRI",
      "meta": {
        "shortened": true,
        "fullName": "Badrinath Subramaniam"
      }
    },
    {
      "name": "SUBRA",
      "meta": {
        "shortened": true,
        "fullName": "Badrinath Subramaniam"
      }
    },
    {
      "name": "MANOJ",
      "meta": {
        "shortened": false,
        "fullName": "Manoj Tiwary"
      }
    },
    {
      "name": "TIWAR",
      "meta": {
        "shortened": true,
        "fullName": "Manoj Tiwary"
      }
    },
    {
      "name": "ABHIM",
      "meta": {
        "shortened": true,
        "fullName": "Abhimanyu Mithun"
      }
    },
    {
      "name": "MITHU",
      "meta": {
        "shortened": true,
        "fullName": "Abhimanyu Mithun"
      }
    },
    {
      "name": "MURAL",
      "meta": {
        "shortened": true,
        "fullName": "Murali Vijay"
      }
    },
    {
      "name": "VIJAY",
      "meta": {
        "shortened": false,
        "fullName": "Murali Vijay"
      }
    },
    {
      "name": "WRIDD",
      "meta": {
        "shortened": true,
        "fullName": "Wriddhiman Saha"
      }
    },
    {
      "name": "SAHA",
      "meta": {
        "shortened": false,
        "fullName": "Wriddhiman Saha"
      }
    },
    {
      "name": "AMBAT",
      "meta": {
        "shortened": true,
        "fullName": "Ambati Rayudu"
      }
    },
    {
      "name": "RAYUD",
      "meta": {
        "shortened": true,
        "fullName": "Ambati Rayudu"
      }
    },
    {
      "name": "KEDAR",
      "meta": {
        "shortened": false,
        "fullName": "Kedar Jadhav"
      }
    },
    {
      "name": "JADHA",
      "meta": {
        "shortened": true,
        "fullName": "Kedar Jadhav"
      }
    },
    {
      "name": "MANIS",
      "meta": {
        "shortened": true,
        "fullName": "Manish Pandey"
      }
    },
    {
      "name": "PANDE",
      "meta": {
        "shortened": true,
        "fullName": "Manish Pandey"
      }
    },
    {
      "name": "PARTH",
      "meta": {
        "shortened": true,
        "fullName": "Parthiv Patel"
      }
    },
    {
      "name": "PATEL",
      "meta": {
        "shortened": false,
        "fullName": "Parthiv Patel"
      }
    },
    {
      "name": "SHARD",
      "meta": {
        "shortened": true,
        "fullName": "Shardul Thakur"
      }
    },
    {
      "name": "THAKU",
      "meta": {
        "shortened": true,
        "fullName": "Shardul Thakur"
      }
    },
    {
      "name": "UMESH",
      "meta": {
        "shortened": false,
        "fullName": "Umesh Yadav"
      }
    },
    {
      "name": "YADAV",
      "meta": {
        "shortened": false,
        "fullName": "Umesh Yadav"
      }
    },
    {
      "name": "BHUVN",
      "meta": {
        "shortened": true,
        "fullName": "Bhuvneshwar Kumar"
      }
    },
    {
      "name": "KUMAR",
      "meta": {
        "shortened": false,
        "fullName": "Bhuvneshwar Kumar"
      }
    },
    {
      "name": "MAYAN",
      "meta": {
        "shortened": true,
        "fullName": "Mayank Agarwal"
      }
    },
    {
      "name": "AGARW",
      "meta": {
        "shortened": true,
        "fullName": "Mayank Agarwal"
      }
    },
    {
      "name": "PRITH",
      "meta": {
        "shortened": true,
        "fullName": "Prithvi Shaw"
      }
    },
    {
      "name": "SHAW",
      "meta": {
        "shortened": false,
        "fullName": "Prithvi Shaw"
      }
    },
    {
      "name": "NAVDE",
      "meta": {
        "shortened": true,
        "fullName": "Navdeep Saini"
      }
    },
    {
      "name": "SAINI",
      "meta": {
        "shortened": false,
        "fullName": "Navdeep Saini"
      }
    },
    {
      "name": "WASHI",
      "meta": {
        "shortened": true,
        "fullName": "Washington Sundar"
      }
    },
    {
      "name": "SUNDA",
      "meta": {
        "shortened": true,
        "fullName": "Washington Sundar"
      }
    },
    {
      "name": "VENKA",
      "meta": {
        "shortened": true,
        "fullName": "Venkatesh Iyer"
      }
    },
    {
      "name": "IYER",
      "meta": {
        "shortened": false,
        "fullName": "Venkatesh Iyer"
      }
    },
    {
      "name": "HARSH",
      "meta": {
        "shortened": true,
        "fullName": "Harshal Patel"
      }
    },
    {
      "name": "PATEL",
      "meta": {
        "shortened": false,
        "fullName": "Harshal Patel"
      }
    },
    {
      "name": "DEEPA",
      "meta": {
        "shortened": true,
        "fullName": "Deepak Hooda"
      }
    },
    {
      "name": "HOODA",
      "meta": {
        "shortened": false,
        "fullName": "Deepak Hooda"
      }
    },
    {
      "name": "SAI",
      "meta": {
        "shortened": false,
        "fullName": "Sai Sudharsan"
      }
    },
    {
      "name": "SUDHA",
      "meta": {
        "shortened": true,
        "fullName": "Sai Sudharsan"
      }
    },
    {
      "name": "SHIVA",
      "meta": {
        "shortened": true,
        "fullName": "Shivam Dube"
      }
    },
    {
      "name": "DUBE",
      "meta": {
        "shortened": false,
        "fullName": "Shivam Dube"
      }
    },
    {
      "name": "JITES",
      "meta": {
        "shortened": true,
        "fullName": "Jitesh Sharma"
      }
    },
    {
      "name": "SHARM",
      "meta": {
        "shortened": true,
        "fullName": "Jitesh Sharma"
      }
    },
    {
      "name": "KULDE",
      "meta": {
        "shortened": true,
        "fullName": "Kuldeep Sen"
      }
    },
    {
      "name": "SEN",
      "meta": {
        "shortened": false,
        "fullName": "Kuldeep Sen"
      }
    },
    {
      "name": "MUKES",
      "meta": {
        "shortened": true,
        "fullName": "Mukesh Kumar"
      }
    },
    {
      "name": "KUMAR",
      "meta": {
        "shortened": false,
        "fullName": "Mukesh Kumar"
      }
    },
    {
      "name": "PRASI",
      "meta": {
        "shortened": true,
        "fullName": "Prasidh Krishna"
      }
    },
    {
      "name": "KRISH",
      "meta": {
        "shortened": true,
        "fullName": "Prasidh Krishna"
      }
    },
    {
      "name": "AVESH",
      "meta": {
        "shortened": false,
        "fullName": "Avesh Khan"
      }
    },
    {
      "name": "KHAN",
      "meta": {
        "shortened": false,
        "fullName": "Avesh Khan"
      }
    },
    {
      "name": "MOHIT",
      "meta": {
        "shortened": false,
        "fullName": "Mohit Sharma"
      }
    },
    {
      "name": "SHARM",
      "meta": {
        "shortened": true,
        "fullName": "Mohit Sharma"
      }
    },
    {
      "name": "RAVI",
      "meta": {
        "shortened": false,
        "fullName": "Ravi Bishnoi"
      }
    },
    {
      "name": "BISHN",
      "meta": {
        "shortened": true,
        "fullName": "Ravi Bishnoi"
      }
    },
    {
      "name": "VARUN",
      "meta": {
        "shortened": false,
        "fullName": "Varun Chakravarthy"
      }
    },
    {
      "name": "CHAKR",
      "meta": {
        "shortened": true,
        "fullName": "Varun Chakravarthy"
      }
    },
    {
      "name": "KHALE",
      "meta": {
        "shortened": true,
        "fullName": "Khaleel Ahmed"
      }
    },
    {
      "name": "AHMED",
      "meta": {
        "shortened": false,
        "fullName": "Khaleel Ahmed"
      }
    },
    {
      "name": "MOHAM",
      "meta": {
        "shortened": true,
        "fullName": "Mohammed Azharuddeen"
      }
    },
    {
      "name": "AZHAR",
      "meta": {
        "shortened": true,
        "fullName": "Mohammed Azharuddeen"
      }
    },
    {
      "name": "RIYAN",
      "meta": {
        "shortened": false,
        "fullName": "Riyan Parag"
      }
    },
    {
      "name": "PARAG",
      "meta": {
        "shortened": false,
        "fullName": "Riyan Parag"
      }
    },
    {
      "name": "ABHIS",
      "meta": {
        "shortened": true,
        "fullName": "Abhishek Sharma"
      }
    },
    {
      "name": "SHARM",
      "meta": {
        "shortened": true,
        "fullName": "Abhishek Sharma"
      }
    },
    {
      "name": "NITIS",
      "meta": {
        "shortened": true,
        "fullName": "Nitish Kumar Reddy"
      }
    },
    {
      "name": "KUMAR",
      "meta": {
        "shortened": false,
        "fullName": "Nitish Kumar Reddy"
      }
    },
    {
      "name": "REDDY",
      "meta": {
        "shortened": false,
        "fullName": "Nitish Kumar Reddy"
      }
    },
    {
      "name": "HARSH",
      "meta": {
        "shortened": true,
        "fullName": "Harshit Rana"
      }
    },
    {
      "name": "RANA",
      "meta": {
        "shortened": false,
        "fullName": "Harshit Rana"
      }
    },
    {
      "name": "YASH",
      "meta": {
        "shortened": false,
        "fullName": "Yash Dayal"
      }
    },
    {
      "name": "DAYAL",
      "meta": {
        "shortened": false,
        "fullName": "Yash Dayal"
      }
    },
    {
      "name": "AKASH",
      "meta": {
        "shortened": false,
        "fullName": "Akash Deep"
      }
    },
    {
      "name": "DEEP",
      "meta": {
        "shortened": false,
        "fullName": "Akash Deep"
      }
    },
    {
      "name": "TUSHA",
      "meta": {
        "shortened": true,
        "fullName": "Tushar Deshpande"
      }
    },
    {
      "name": "DESHP",
      "meta": {
        "shortened": true,
        "fullName": "Tushar Deshpande"
      }
    },
    {
      "name": "VYSHA",
      "meta": {
        "shortened": true,
        "fullName": "Vyshak Vijaykumar"
      }
    },
    {
      "name": "VIJAY",
      "meta": {
        "shortened": true,
        "fullName": "Vyshak Vijaykumar"
      }
    },
    {
      "name": "DEVDU",
      "meta": {
        "shortened": true,
        "fullName": "Devdutt Padikkal"
      }
    },
    {
      "name": "PADIK",
      "meta": {
        "shortened": true,
        "fullName": "Devdutt Padikkal"
      }
    },
    {
      "name": "SHAMS",
      "meta": {
        "shortened": false,
        "fullName": "Shams Mulani"
      }
    },
    {
      "name": "MULAN",
      "meta": {
        "shortened": true,
        "fullName": "Shams Mulani"
      }
    },
    {
      "name": "ARYAN",
      "meta": {
        "shortened": false,
        "fullName": "Aryan Juyal"
      }
    },
    {
      "name": "JUYAL",
      "meta": {
        "shortened": false,
        "fullName": "Aryan Juyal"
      }
    },
    {
      "name": "NAMAN",
      "meta": {
        "shortened": false,
        "fullName": "Naman Dhir"
      }
    },
    {
      "name": "DHIR",
      "meta": {
        "shortened": false,
        "fullName": "Naman Dhir"
      }
    },
    {
      "name": "PRIYA",
      "meta": {
        "shortened": true,
        "fullName": "Priyansh Arya"
      }
    },
    {
      "name": "ARYA",
      "meta": {
        "shortened": false,
        "fullName": "Priyansh Arya"
      }
    },
    {
      "name": "MUSHE",
      "meta": {
        "shortened": true,
        "fullName": "Musheer Khan"
      }
    },
    {
      "name": "KHAN",
      "meta": {
        "shortened": false,
        "fullName": "Musheer Khan"
      }
    },
    {
      "name": "DHRUV",
      "meta": {
        "shortened": false,
        "fullName": "Dhruv Jurel"
      }
    },
    {
      "name": "JUREL",
      "meta": {
        "shortened": false,
        "fullName": "Dhruv Jurel"
      }
    },
    {
      "name": "TANUS",
      "meta": {
        "shortened": true,
        "fullName": "Tanush Kotian"
      }
    },
    {
      "name": "KOTIA",
      "meta": {
        "shortened": true,
        "fullName": "Tanush Kotian"
      }
    },
    {
      "name": "KUMAR",
      "meta": {
        "shortened": false,
        "fullName": "Kumar Kushagra"
      }
    },
    {
      "name": "KUSHA",
      "meta": {
        "shortened": true,
        "fullName": "Kumar Kushagra"
      }
    },
    {
      "name": "MARNU",
      "meta": {
        "shortened": true,
        "fullName": "Marnus Labuschagne"
      }
    },
    {
      "name": "LABUS",
      "meta": {
        "shortened": true,
        "fullName": "Marnus Labuschagne"
      }
    },
    {
      "name": "DAVID",
      "meta": {
        "shortened": false,
        "fullName": "David Hussey"
      }
    },
    {
      "name": "HUSSE",
      "meta": {
        "shortened": true,
        "fullName": "David Hussey"
      }
    },
    {
      "name": "MICHA",
      "meta": {
        "shortened": true,
        "fullName": "Michael Clarke"
      }
    },
    {
      "name": "CLARK",
      "meta": {
        "shortened": true,
        "fullName": "Michael Clarke"
      }
    },
    {
      "name": "ANDRE",
      "meta": {
        "shortened": true,
        "fullName": "Andrew Symonds"
      }
    },
    {
      "name": "SYMON",
      "meta": {
        "shortened": true,
        "fullName": "Andrew Symonds"
      }
    },
    {
      "name": "BRETT",
      "meta": {
        "shortened": false,
        "fullName": "Brett Lee"
      }
    },
    {
      "name": "LEE",
      "meta": {
        "shortened": false,
        "fullName": "Brett Lee"
      }
    },
    {
      "name": "JASON",
      "meta": {
        "shortened": false,
        "fullName": "Jason Gillespie"
      }
    },
    {
      "name": "GILLE",
      "meta": {
        "shortened": true,
        "fullName": "Jason Gillespie"
      }
    },
    {
      "name": "DAMIE",
      "meta": {
        "shortened": true,
        "fullName": "Damien Martyn"
      }
    },
    {
      "name": "MARTY",
      "meta": {
        "shortened": true,
        "fullName": "Damien Martyn"
      }
    },
    {
      "name": "MIKE",
      "meta": {
        "shortened": false,
        "fullName": "Mike Hussey"
      }
    },
    {
      "name": "HUSSE",
      "meta": {
        "shortened": true,
        "fullName": "Mike Hussey"
      }
    },
    {
      "name": "SIMON",
      "meta": {
        "shortened": false,
        "fullName": "Simon Katich"
      }
    },
    {
      "name": "KATIC",
      "meta": {
        "shortened": true,
        "fullName": "Simon Katich"
      }
    },
    {
      "name": "BRAD",
      "meta": {
        "shortened": false,
        "fullName": "Brad Haddin"
      }
    },
    {
      "name": "HADDI",
      "meta": {
        "shortened": true,
        "fullName": "Brad Haddin"
      }
    },
    {
      "name": "NATHA",
      "meta": {
        "shortened": true,
        "fullName": "Nathan Lyon"
      }
    },
    {
      "name": "LYON",
      "meta": {
        "shortened": false,
        "fullName": "Nathan Lyon"
      }
    },
    {
      "name": "ALEX",
      "meta": {
        "shortened": false,
        "fullName": "Alex Carey"
      }
    },
    {
      "name": "CAREY",
      "meta": {
        "shortened": false,
        "fullName": "Alex Carey"
      }
    },
    {
      "name": "STEVE",
      "meta": {
        "shortened": true,
        "fullName": "Steven Smith"
      }
    },
    {
      "name": "SMITH",
      "meta": {
        "shortened": false,
        "fullName": "Steven Smith"
      }
    },
    {
      "name": "USMAN",
      "meta": {
        "shortened": false,
        "fullName": "Usman Khawaja"
      }
    },
    {
      "name": "KHAWA",
      "meta": {
        "shortened": true,
        "fullName": "Usman Khawaja"
      }
    },
    {
      "name": "MARCU",
      "meta": {
        "shortened": true,
        "fullName": "Marcus Stoinis"
      }
    },
    {
      "name": "STOIN",
      "meta": {
        "shortened": true,
        "fullName": "Marcus Stoinis"
      }
    },
    {
      "name": "MATTH",
      "meta": {
        "shortened": true,
        "fullName": "Matthew Short"
      }
    },
    {
      "name": "SHORT",
      "meta": {
        "shortened": false,
        "fullName": "Matthew Short"
      }
    },
    {
      "name": "JAKE",
      "meta": {
        "shortened": false,
        "fullName": "Jake Fraser McGurk"
      }
    },
    {
      "name": "FRASE",
      "meta": {
        "shortened": true,
        "fullName": "Jake Fraser McGurk"
      }
    },
    {
      "name": "MCGUR",
      "meta": {
        "shortened": true,
        "fullName": "Jake Fraser McGurk"
      }
    },
    {
      "name": "SPENC",
      "meta": {
        "shortened": true,
        "fullName": "Spencer Johnson"
      }
    },
    {
      "name": "JOHNS",
      "meta": {
        "shortened": true,
        "fullName": "Spencer Johnson"
      }
    },
    {
      "name": "LANCE",
      "meta": {
        "shortened": false,
        "fullName": "Lance Morris"
      }
    },
    {
      "name": "MORRI",
      "meta": {
        "shortened": true,
        "fullName": "Lance Morris"
      }
    },
    {
      "name": "AARON",
      "meta": {
        "shortened": false,
        "fullName": "Aaron Hardie"
      }
    },
    {
      "name": "HARDI",
      "meta": {
        "shortened": true,
        "fullName": "Aaron Hardie"
      }
    },
    {
      "name": "COOPE",
      "meta": {
        "shortened": true,
        "fullName": "Cooper Connolly"
      }
    },
    {
      "name": "CONNO",
      "meta": {
        "shortened": true,
        "fullName": "Cooper Connolly"
      }
    },
    {
      "name": "ALAST",
      "meta": {
        "shortened": true,
        "fullName": "Alastair Cook"
      }
    },
    {
      "name": "COOK",
      "meta": {
        "shortened": false,
        "fullName": "Alastair Cook"
      }
    },
    {
      "name": "MICHA",
      "meta": {
        "shortened": true,
        "fullName": "Michael Vaughan"
      }
    },
    {
      "name": "VAUGH",
      "meta": {
        "shortened": true,
        "fullName": "Michael Vaughan"
      }
    },
    {
      "name": "NASSE",
      "meta": {
        "shortened": true,
        "fullName": "Nasser Hussain"
      }
    },
    {
      "name": "HUSSA",
      "meta": {
        "shortened": true,
        "fullName": "Nasser Hussain"
      }
    },
    {
      "name": "GRAHA",
      "meta": {
        "shortened": true,
        "fullName": "Graham Thorpe"
      }
    },
    {
      "name": "THORP",
      "meta": {
        "shortened": true,
        "fullName": "Graham Thorpe"
      }
    },
    {
      "name": "IAN",
      "meta": {
        "shortened": false,
        "fullName": "Ian Botham"
      }
    },
    {
      "name": "BOTHA",
      "meta": {
        "shortened": true,
        "fullName": "Ian Botham"
      }
    },
    {
      "name": "DEREK",
      "meta": {
        "shortened": false,
        "fullName": "Derek Underwood"
      }
    },
    {
      "name": "UNDER",
      "meta": {
        "shortened": true,
        "fullName": "Derek Underwood"
      }
    },
    {
      "name": "PHIL",
      "meta": {
        "shortened": false,
        "fullName": "Phil Tufnell"
      }
    },
    {
      "name": "TUFNE",
      "meta": {
        "shortened": true,
        "fullName": "Phil Tufnell"
      }
    },
    {
      "name": "GRAEM",
      "meta": {
        "shortened": true,
        "fullName": "Graeme Swann"
      }
    },
    {
      "name": "SWANN",
      "meta": {
        "shortened": false,
        "fullName": "Graeme Swann"
      }
    },
    {
      "name": "MATTH",
      "meta": {
        "shortened": true,
        "fullName": "Matthew Prior"
      }
    },
    {
      "name": "PRIOR",
      "meta": {
        "shortened": false,
        "fullName": "Matthew Prior"
      }
    },
    {
      "name": "PAUL",
      "meta": {
        "shortened": false,
        "fullName": "Paul Collingwood"
      }
    },
    {
      "name": "COLLI",
      "meta": {
        "shortened": true,
        "fullName": "Paul Collingwood"
      }
    },
    {
      "name": "IAN",
      "meta": {
        "shortened": false,
        "fullName": "Ian Bell"
      }
    },
    {
      "name": "BELL",
      "meta": {
        "shortened": false,
        "fullName": "Ian Bell"
      }
    },
    {
      "name": "PHIL",
      "meta": {
        "shortened": false,
        "fullName": "Phil DeFreitas"
      }
    },
    {
      "name": "DEFRE",
      "meta": {
        "shortened": true,
        "fullName": "Phil DeFreitas"
      }
    },
    {
      "name": "DARRE",
      "meta": {
        "shortened": true,
        "fullName": "Darren Gough"
      }
    },
    {
      "name": "GOUGH",
      "meta": {
        "shortened": false,
        "fullName": "Darren Gough"
      }
    },
    {
      "name": "STEVE",
      "meta": {
        "shortened": false,
        "fullName": "Steve Harmison"
      }
    },
    {
      "name": "HARMI",
      "meta": {
        "shortened": true,
        "fullName": "Steve Harmison"
      }
    },
    {
      "name": "ZAK",
      "meta": {
        "shortened": false,
        "fullName": "Zak Crawley"
      }
    },
    {
      "name": "CRAWL",
      "meta": {
        "shortened": true,
        "fullName": "Zak Crawley"
      }
    },
    {
      "name": "OLLIE",
      "meta": {
        "shortened": false,
        "fullName": "Ollie Pope"
      }
    },
    {
      "name": "POPE",
      "meta": {
        "shortened": false,
        "fullName": "Ollie Pope"
      }
    },
    {
      "name": "BEN",
      "meta": {
        "shortened": false,
        "fullName": "Ben Duckett"
      }
    },
    {
      "name": "DUCKE",
      "meta": {
        "shortened": true,
        "fullName": "Ben Duckett"
      }
    },
    {
      "name": "GUS",
      "meta": {
        "shortened": false,
        "fullName": "Gus Atkinson"
      }
    },
    {
      "name": "ATKIN",
      "meta": {
        "shortened": true,
        "fullName": "Gus Atkinson"
      }
    },
    {
      "name": "BRYDO",
      "meta": {
        "shortened": true,
        "fullName": "Brydon Carse"
      }
    },
    {
      "name": "CARSE",
      "meta": {
        "shortened": false,
        "fullName": "Brydon Carse"
      }
    },
    {
      "name": "JOSH",
      "meta": {
        "shortened": false,
        "fullName": "Josh Tongue"
      }
    },
    {
      "name": "TONGU",
      "meta": {
        "shortened": true,
        "fullName": "Josh Tongue"
      }
    },
    {
      "name": "JAMIE",
      "meta": {
        "shortened": false,
        "fullName": "Jamie Overton"
      }
    },
    {
      "name": "OVERT",
      "meta": {
        "shortened": true,
        "fullName": "Jamie Overton"
      }
    },
    {
      "name": "LIAM",
      "meta": {
        "shortened": false,
        "fullName": "Liam Dawson"
      }
    },
    {
      "name": "DAWSO",
      "meta": {
        "shortened": true,
        "fullName": "Liam Dawson"
      }
    },
    {
      "name": "SHOAI",
      "meta": {
        "shortened": true,
        "fullName": "Shoaib Bashir"
      }
    },
    {
      "name": "BASHI",
      "meta": {
        "shortened": true,
        "fullName": "Shoaib Bashir"
      }
    },
    {
      "name": "JACOB",
      "meta": {
        "shortened": false,
        "fullName": "Jacob Bethell"
      }
    },
    {
      "name": "BETHE",
      "meta": {
        "shortened": true,
        "fullName": "Jacob Bethell"
      }
    },
    {
      "name": "CLIVE",
      "meta": {
        "shortened": false,
        "fullName": "Clive Lloyd"
      }
    },
    {
      "name": "LLOYD",
      "meta": {
        "shortened": false,
        "fullName": "Clive Lloyd"
      }
    },
    {
      "name": "DESMO",
      "meta": {
        "shortened": true,
        "fullName": "Desmond Haynes"
      }
    },
    {
      "name": "HAYNE",
      "meta": {
        "shortened": true,
        "fullName": "Desmond Haynes"
      }
    },
    {
      "name": "GORDO",
      "meta": {
        "shortened": true,
        "fullName": "Gordon Greenidge"
      }
    },
    {
      "name": "GREEN",
      "meta": {
        "shortened": true,
        "fullName": "Gordon Greenidge"
      }
    },
    {
      "name": "MALCO",
      "meta": {
        "shortened": true,
        "fullName": "Malcolm Marshall"
      }
    },
    {
      "name": "MARSH",
      "meta": {
        "shortened": true,
        "fullName": "Malcolm Marshall"
      }
    },
    {
      "name": "CURTL",
      "meta": {
        "shortened": true,
        "fullName": "Curtly Ambrose"
      }
    },
    {
      "name": "AMBRO",
      "meta": {
        "shortened": true,
        "fullName": "Curtly Ambrose"
      }
    },
    {
      "name": "COURT",
      "meta": {
        "shortened": true,
        "fullName": "Courtney Walsh"
      }
    },
    {
      "name": "WALSH",
      "meta": {
        "shortened": false,
        "fullName": "Courtney Walsh"
      }
    },
    {
      "name": "SHIVN",
      "meta": {
        "shortened": true,
        "fullName": "Shivnarine Chanderpaul"
      }
    },
    {
      "name": "CHAND",
      "meta": {
        "shortened": true,
        "fullName": "Shivnarine Chanderpaul"
      }
    },
    {
      "name": "CARL",
      "meta": {
        "shortened": false,
        "fullName": "Carl Hooper"
      }
    },
    {
      "name": "HOOPE",
      "meta": {
        "shortened": true,
        "fullName": "Carl Hooper"
      }
    },
    {
      "name": "RIDLE",
      "meta": {
        "shortened": true,
        "fullName": "Ridley Jacobs"
      }
    },
    {
      "name": "JACOB",
      "meta": {
        "shortened": true,
        "fullName": "Ridley Jacobs"
      }
    },
    {
      "name": "WAVEL",
      "meta": {
        "shortened": true,
        "fullName": "Wavell Hinds"
      }
    },
    {
      "name": "HINDS",
      "meta": {
        "shortened": false,
        "fullName": "Wavell Hinds"
      }
    },
    {
      "name": "RAMNA",
      "meta": {
        "shortened": true,
        "fullName": "Ramnaresh Sarwan"
      }
    },
    {
      "name": "SARWA",
      "meta": {
        "shortened": true,
        "fullName": "Ramnaresh Sarwan"
      }
    },
    {
      "name": "MARLO",
      "meta": {
        "shortened": true,
        "fullName": "Marlon Samuels"
      }
    },
    {
      "name": "SAMUE",
      "meta": {
        "shortened": true,
        "fullName": "Marlon Samuels"
      }
    },
    {
      "name": "DARRE",
      "meta": {
        "shortened": true,
        "fullName": "Darren Sammy"
      }
    },
    {
      "name": "SAMMY",
      "meta": {
        "shortened": false,
        "fullName": "Darren Sammy"
      }
    },
    {
      "name": "FIDEL",
      "meta": {
        "shortened": false,
        "fullName": "Fidel Edwards"
      }
    },
    {
      "name": "EDWAR",
      "meta": {
        "shortened": true,
        "fullName": "Fidel Edwards"
      }
    },
    {
      "name": "KEMAR",
      "meta": {
        "shortened": false,
        "fullName": "Kemar Roach"
      }
    },
    {
      "name": "ROACH",
      "meta": {
        "shortened": false,
        "fullName": "Kemar Roach"
      }
    },
    {
      "name": "JASON",
      "meta": {
        "shortened": false,
        "fullName": "Jason Holder"
      }
    },
    {
      "name": "HOLDE",
      "meta": {
        "shortened": true,
        "fullName": "Jason Holder"
      }
    },
    {
      "name": "SHIMR",
      "meta": {
        "shortened": true,
        "fullName": "Shimron Hetmyer"
      }
    },
    {
      "name": "HETMY",
      "meta": {
        "shortened": true,
        "fullName": "Shimron Hetmyer"
      }
    },
    {
      "name": "ROVMA",
      "meta": {
        "shortened": true,
        "fullName": "Rovman Powell"
      }
    },
    {
      "name": "POWEL",
      "meta": {
        "shortened": true,
        "fullName": "Rovman Powell"
      }
    },
    {
      "name": "ALZAR",
      "meta": {
        "shortened": true,
        "fullName": "Alzarri Joseph"
      }
    },
    {
      "name": "JOSEP",
      "meta": {
        "shortened": true,
        "fullName": "Alzarri Joseph"
      }
    },
    {
      "name": "KYLE",
      "meta": {
        "shortened": false,
        "fullName": "Kyle Mayers"
      }
    },
    {
      "name": "MAYER",
      "meta": {
        "shortened": true,
        "fullName": "Kyle Mayers"
      }
    },
    {
      "name": "BRAND",
      "meta": {
        "shortened": true,
        "fullName": "Brandon King"
      }
    },
    {
      "name": "KING",
      "meta": {
        "shortened": false,
        "fullName": "Brandon King"
      }
    },
    {
      "name": "EVIN",
      "meta": {
        "shortened": false,
        "fullName": "Evin Lewis"
      }
    },
    {
      "name": "LEWIS",
      "meta": {
        "shortened": false,
        "fullName": "Evin Lewis"
      }
    },
    {
      "name": "AKEAL",
      "meta": {
        "shortened": false,
        "fullName": "Akeal Hosein"
      }
    },
    {
      "name": "HOSEI",
      "meta": {
        "shortened": true,
        "fullName": "Akeal Hosein"
      }
    },
    {
      "name": "GUDAK",
      "meta": {
        "shortened": true,
        "fullName": "Gudakesh Motie"
      }
    },
    {
      "name": "MOTIE",
      "meta": {
        "shortened": false,
        "fullName": "Gudakesh Motie"
      }
    },
    {
      "name": "SHAMA",
      "meta": {
        "shortened": true,
        "fullName": "Shamar Joseph"
      }
    },
    {
      "name": "JOSEP",
      "meta": {
        "shortened": true,
        "fullName": "Shamar Joseph"
      }
    },
    {
      "name": "MATTH",
      "meta": {
        "shortened": true,
        "fullName": "Matthew Forde"
      }
    },
    {
      "name": "FORDE",
      "meta": {
        "shortened": false,
        "fullName": "Matthew Forde"
      }
    },
    {
      "name": "JEWEL",
      "meta": {
        "shortened": false,
        "fullName": "Jewel Andrew"
      }
    },
    {
      "name": "ANDRE",
      "meta": {
        "shortened": true,
        "fullName": "Jewel Andrew"
      }
    },
    {
      "name": "GRAEM",
      "meta": {
        "shortened": true,
        "fullName": "Graeme Smith"
      }
    },
    {
      "name": "SMITH",
      "meta": {
        "shortened": false,
        "fullName": "Graeme Smith"
      }
    },
    {
      "name": "HERSC",
      "meta": {
        "shortened": true,
        "fullName": "Herschelle Gibbs"
      }
    },
    {
      "name": "GIBBS",
      "meta": {
        "shortened": false,
        "fullName": "Herschelle Gibbs"
      }
    },
    {
      "name": "SHAUN",
      "meta": {
        "shortened": false,
        "fullName": "Shaun Pollock"
      }
    },
    {
      "name": "POLLO",
      "meta": {
        "shortened": true,
        "fullName": "Shaun Pollock"
      }
    },
    {
      "name": "LANCE",
      "meta": {
        "shortened": false,
        "fullName": "Lance Klusener"
      }
    },
    {
      "name": "KLUSE",
      "meta": {
        "shortened": true,
        "fullName": "Lance Klusener"
      }
    },
    {
      "name": "MARK",
      "meta": {
        "shortened": false,
        "fullName": "Mark Boucher"
      }
    },
    {
      "name": "BOUCH",
      "meta": {
        "shortened": true,
        "fullName": "Mark Boucher"
      }
    },
    {
      "name": "GARY",
      "meta": {
        "shortened": false,
        "fullName": "Gary Kirsten"
      }
    },
    {
      "name": "KIRST",
      "meta": {
        "shortened": true,
        "fullName": "Gary Kirsten"
      }
    },
    {
      "name": "JONTY",
      "meta": {
        "shortened": false,
        "fullName": "Jonty Rhodes"
      }
    },
    {
      "name": "RHODE",
      "meta": {
        "shortened": true,
        "fullName": "Jonty Rhodes"
      }
    },
    {
      "name": "ALLAN",
      "meta": {
        "shortened": false,
        "fullName": "Allan Donald"
      }
    },
    {
      "name": "DONAL",
      "meta": {
        "shortened": true,
        "fullName": "Allan Donald"
      }
    },
    {
      "name": "MAKHA",
      "meta": {
        "shortened": true,
        "fullName": "Makhaya Ntini"
      }
    },
    {
      "name": "NTINI",
      "meta": {
        "shortened": false,
        "fullName": "Makhaya Ntini"
      }
    },
    {
      "name": "ANDRE",
      "meta": {
        "shortened": true,
        "fullName": "Andrew Hall"
      }
    },
    {
      "name": "HALL",
      "meta": {
        "shortened": false,
        "fullName": "Andrew Hall"
      }
    },
    {
      "name": "MARCO",
      "meta": {
        "shortened": false,
        "fullName": "Marco Jansen"
      }
    },
    {
      "name": "JANSE",
      "meta": {
        "shortened": true,
        "fullName": "Marco Jansen"
      }
    },
    {
      "name": "GERAL",
      "meta": {
        "shortened": true,
        "fullName": "Gerald Coetzee"
      }
    },
    {
      "name": "COETZ",
      "meta": {
        "shortened": true,
        "fullName": "Gerald Coetzee"
      }
    },
    {
      "name": "TRIST",
      "meta": {
        "shortened": true,
        "fullName": "Tristan Stubbs"
      }
    },
    {
      "name": "STUBB",
      "meta": {
        "shortened": true,
        "fullName": "Tristan Stubbs"
      }
    },
    {
      "name": "REEZA",
      "meta": {
        "shortened": false,
        "fullName": "Reeza Hendricks"
      }
    },
    {
      "name": "HENDR",
      "meta": {
        "shortened": true,
        "fullName": "Reeza Hendricks"
      }
    },
    {
      "name": "TONY",
      "meta": {
        "shortened": false,
        "fullName": "Tony de Zorzi"
      }
    },
    {
      "name": "DE",
      "meta": {
        "shortened": false,
        "fullName": "Tony de Zorzi"
      }
    },
    {
      "name": "ZORZI",
      "meta": {
        "shortened": false,
        "fullName": "Tony de Zorzi"
      }
    },
    {
      "name": "RYAN",
      "meta": {
        "shortened": false,
        "fullName": "Ryan Rickelton"
      }
    },
    {
      "name": "RICKE",
      "meta": {
        "shortened": true,
        "fullName": "Ryan Rickelton"
      }
    },
    {
      "name": "WIAAN",
      "meta": {
        "shortened": false,
        "fullName": "Wiaan Mulder"
      }
    },
    {
      "name": "MULDE",
      "meta": {
        "shortened": true,
        "fullName": "Wiaan Mulder"
      }
    },
    {
      "name": "PATRI",
      "meta": {
        "shortened": true,
        "fullName": "Patrick Kruger"
      }
    },
    {
      "name": "KRUGE",
      "meta": {
        "shortened": true,
        "fullName": "Patrick Kruger"
      }
    },
    {
      "name": "STEPH",
      "meta": {
        "shortened": true,
        "fullName": "Stephen Fleming"
      }
    },
    {
      "name": "FLEMI",
      "meta": {
        "shortened": true,
        "fullName": "Stephen Fleming"
      }
    },
    {
      "name": "CHRIS",
      "meta": {
        "shortened": false,
        "fullName": "Chris Cairns"
      }
    },
    {
      "name": "CAIRN",
      "meta": {
        "shortened": true,
        "fullName": "Chris Cairns"
      }
    },
    {
      "name": "DANIE",
      "meta": {
        "shortened": true,
        "fullName": "Daniel Vettori"
      }
    },
    {
      "name": "VETTO",
      "meta": {
        "shortened": true,
        "fullName": "Daniel Vettori"
      }
    },
    {
      "name": "NATHA",
      "meta": {
        "shortened": true,
        "fullName": "Nathan Astle"
      }
    },
    {
      "name": "ASTLE",
      "meta": {
        "shortened": false,
        "fullName": "Nathan Astle"
      }
    },
    {
      "name": "CHRIS",
      "meta": {
        "shortened": false,
        "fullName": "Chris Harris"
      }
    },
    {
      "name": "HARRI",
      "meta": {
        "shortened": true,
        "fullName": "Chris Harris"
      }
    },
    {
      "name": "ROSS",
      "meta": {
        "shortened": false,
        "fullName": "Ross Taylor"
      }
    },
    {
      "name": "TAYLO",
      "meta": {
        "shortened": true,
        "fullName": "Ross Taylor"
      }
    },
    {
      "name": "TIM",
      "meta": {
        "shortened": false,
        "fullName": "Tim Southee"
      }
    },
    {
      "name": "SOUTH",
      "meta": {
        "shortened": true,
        "fullName": "Tim Southee"
      }
    },
    {
      "name": "LOCKI",
      "meta": {
        "shortened": true,
        "fullName": "Lockie Ferguson"
      }
    },
    {
      "name": "FERGU",
      "meta": {
        "shortened": true,
        "fullName": "Lockie Ferguson"
      }
    },
    {
      "name": "FINN",
      "meta": {
        "shortened": false,
        "fullName": "Finn Allen"
      }
    },
    {
      "name": "ALLEN",
      "meta": {
        "shortened": false,
        "fullName": "Finn Allen"
      }
    },
    {
      "name": "GLENN",
      "meta": {
        "shortened": false,
        "fullName": "Glenn Phillips"
      }
    },
    {
      "name": "PHILL",
      "meta": {
        "shortened": true,
        "fullName": "Glenn Phillips"
      }
    },
    {
      "name": "MICHA",
      "meta": {
        "shortened": true,
        "fullName": "Michael Bracewell"
      }
    },
    {
      "name": "BRACE",
      "meta": {
        "shortened": true,
        "fullName": "Michael Bracewell"
      }
    },
    {
      "name": "RACHI",
      "meta": {
        "shortened": true,
        "fullName": "Rachin Ravindra"
      }
    },
    {
      "name": "RAVIN",
      "meta": {
        "shortened": true,
        "fullName": "Rachin Ravindra"
      }
    },
    {
      "name": "MARK",
      "meta": {
        "shortened": false,
        "fullName": "Mark Chapman"
      }
    },
    {
      "name": "CHAPM",
      "meta": {
        "shortened": true,
        "fullName": "Mark Chapman"
      }
    },
    {
      "name": "WILL",
      "meta": {
        "shortened": false,
        "fullName": "Will Young"
      }
    },
    {
      "name": "YOUNG",
      "meta": {
        "shortened": false,
        "fullName": "Will Young"
      }
    },
    {
      "name": "TOM",
      "meta": {
        "shortened": false,
        "fullName": "Tom Blundell"
      }
    },
    {
      "name": "BLUND",
      "meta": {
        "shortened": true,
        "fullName": "Tom Blundell"
      }
    },
    {
      "name": "ADAM",
      "meta": {
        "shortened": false,
        "fullName": "Adam Milne"
      }
    },
    {
      "name": "MILNE",
      "meta": {
        "shortened": false,
        "fullName": "Adam Milne"
      }
    },
    {
      "name": "BEN",
      "meta": {
        "shortened": false,
        "fullName": "Ben Sears"
      }
    },
    {
      "name": "SEARS",
      "meta": {
        "shortened": false,
        "fullName": "Ben Sears"
      }
    },
    {
      "name": "NATHA",
      "meta": {
        "shortened": true,
        "fullName": "Nathan Smith"
      }
    },
    {
      "name": "SMITH",
      "meta": {
        "shortened": false,
        "fullName": "Nathan Smith"
      }
    },
    {
      "name": "ARAVI",
      "meta": {
        "shortened": true,
        "fullName": "Aravinda de Silva"
      }
    },
    {
      "name": "DE",
      "meta": {
        "shortened": false,
        "fullName": "Aravinda de Silva"
      }
    },
    {
      "name": "SILVA",
      "meta": {
        "shortened": false,
        "fullName": "Aravinda de Silva"
      }
    },
    {
      "name": "ARJUN",
      "meta": {
        "shortened": true,
        "fullName": "Arjuna Ranatunga"
      }
    },
    {
      "name": "RANAT",
      "meta": {
        "shortened": true,
        "fullName": "Arjuna Ranatunga"
      }
    },
    {
      "name": "SANAT",
      "meta": {
        "shortened": true,
        "fullName": "Sanath Jayasuriya"
      }
    },
    {
      "name": "JAYAS",
      "meta": {
        "shortened": true,
        "fullName": "Sanath Jayasuriya"
      }
    },
    {
      "name": "ROSHA",
      "meta": {
        "shortened": true,
        "fullName": "Roshan Mahanama"
      }
    },
    {
      "name": "MAHAN",
      "meta": {
        "shortened": true,
        "fullName": "Roshan Mahanama"
      }
    },
    {
      "name": "ROMES",
      "meta": {
        "shortened": true,
        "fullName": "Romesh Kaluwitharana"
      }
    },
    {
      "name": "KALUW",
      "meta": {
        "shortened": true,
        "fullName": "Romesh Kaluwitharana"
      }
    },
    {
      "name": "CHAMI",
      "meta": {
        "shortened": true,
        "fullName": "Chaminda Vaas"
      }
    },
    {
      "name": "VAAS",
      "meta": {
        "shortened": false,
        "fullName": "Chaminda Vaas"
      }
    },
    {
      "name": "ANGEL",
      "meta": {
        "shortened": true,
        "fullName": "Angelo Mathews"
      }
    },
    {
      "name": "MATHE",
      "meta": {
        "shortened": true,
        "fullName": "Angelo Mathews"
      }
    },
    {
      "name": "DASUN",
      "meta": {
        "shortened": false,
        "fullName": "Dasun Shanaka"
      }
    },
    {
      "name": "SHANA",
      "meta": {
        "shortened": true,
        "fullName": "Dasun Shanaka"
      }
    },
    {
      "name": "KUSAL",
      "meta": {
        "shortened": false,
        "fullName": "Kusal Mendis"
      }
    },
    {
      "name": "MENDI",
      "meta": {
        "shortened": true,
        "fullName": "Kusal Mendis"
      }
    },
    {
      "name": "PATHU",
      "meta": {
        "shortened": true,
        "fullName": "Pathum Nissanka"
      }
    },
    {
      "name": "NISSA",
      "meta": {
        "shortened": true,
        "fullName": "Pathum Nissanka"
      }
    },
    {
      "name": "DHANA",
      "meta": {
        "shortened": true,
        "fullName": "Dhananjaya de Silva"
      }
    },
    {
      "name": "DE",
      "meta": {
        "shortened": false,
        "fullName": "Dhananjaya de Silva"
      }
    },
    {
      "name": "SILVA",
      "meta": {
        "shortened": false,
        "fullName": "Dhananjaya de Silva"
      }
    },
    {
      "name": "MAHEE",
      "meta": {
        "shortened": true,
        "fullName": "Maheesh Theekshana"
      }
    },
    {
      "name": "THEEK",
      "meta": {
        "shortened": true,
        "fullName": "Maheesh Theekshana"
      }
    },
    {
      "name": "ASITH",
      "meta": {
        "shortened": true,
        "fullName": "Asitha Fernando"
      }
    },
    {
      "name": "FERNA",
      "meta": {
        "shortened": true,
        "fullName": "Asitha Fernando"
      }
    },
    {
      "name": "JEFFR",
      "meta": {
        "shortened": true,
        "fullName": "Jeffrey Vandersay"
      }
    },
    {
      "name": "VANDE",
      "meta": {
        "shortened": true,
        "fullName": "Jeffrey Vandersay"
      }
    },
    {
      "name": "CHARI",
      "meta": {
        "shortened": true,
        "fullName": "Charith Asalanka"
      }
    },
    {
      "name": "ASALA",
      "meta": {
        "shortened": true,
        "fullName": "Charith Asalanka"
      }
    },
    {
      "name": "LAHIR",
      "meta": {
        "shortened": true,
        "fullName": "Lahiru Kumara"
      }
    },
    {
      "name": "KUMAR",
      "meta": {
        "shortened": true,
        "fullName": "Lahiru Kumara"
      }
    },
    {
      "name": "DUNIT",
      "meta": {
        "shortened": true,
        "fullName": "Dunith Wellalage"
      }
    },
    {
      "name": "WELLA",
      "meta": {
        "shortened": true,
        "fullName": "Dunith Wellalage"
      }
    },
    {
      "name": "MATHE",
      "meta": {
        "shortened": true,
        "fullName": "Matheesha Pathirana"
      }
    },
    {
      "name": "PATHI",
      "meta": {
        "shortened": true,
        "fullName": "Matheesha Pathirana"
      }
    },
    {
      "name": "JANIT",
      "meta": {
        "shortened": true,
        "fullName": "Janith Liyanage"
      }
    },
    {
      "name": "LIYAN",
      "meta": {
        "shortened": true,
        "fullName": "Janith Liyanage"
      }
    },
    {
      "name": "IMRAN",
      "meta": {
        "shortened": false,
        "fullName": "Imran Khan"
      }
    },
    {
      "name": "KHAN",
      "meta": {
        "shortened": false,
        "fullName": "Imran Khan"
      }
    },
    {
      "name": "JAVED",
      "meta": {
        "shortened": false,
        "fullName": "Javed Miandad"
      }
    },
    {
      "name": "MIAND",
      "meta": {
        "shortened": true,
        "fullName": "Javed Miandad"
      }
    },
    {
      "name": "INZAM",
      "meta": {
        "shortened": true,
        "fullName": "Inzamam ul Haq"
      }
    },
    {
      "name": "UL",
      "meta": {
        "shortened": false,
        "fullName": "Inzamam ul Haq"
      }
    },
    {
      "name": "HAQ",
      "meta": {
        "shortened": false,
        "fullName": "Inzamam ul Haq"
      }
    },
    {
      "name": "SAEED",
      "meta": {
        "shortened": false,
        "fullName": "Saeed Anwar"
      }
    },
    {
      "name": "ANWAR",
      "meta": {
        "shortened": false,
        "fullName": "Saeed Anwar"
      }
    },
    {
      "name": "MOHAM",
      "meta": {
        "shortened": true,
        "fullName": "Mohammad Yousuf"
      }
    },
    {
      "name": "YOUSU",
      "meta": {
        "shortened": true,
        "fullName": "Mohammad Yousuf"
      }
    },
    {
      "name": "MISBA",
      "meta": {
        "shortened": true,
        "fullName": "Misbah ul Haq"
      }
    },
    {
      "name": "UL",
      "meta": {
        "shortened": false,
        "fullName": "Misbah ul Haq"
      }
    },
    {
      "name": "HAQ",
      "meta": {
        "shortened": false,
        "fullName": "Misbah ul Haq"
      }
    },
    {
      "name": "UMAR",
      "meta": {
        "shortened": false,
        "fullName": "Umar Akmal"
      }
    },
    {
      "name": "AKMAL",
      "meta": {
        "shortened": false,
        "fullName": "Umar Akmal"
      }
    },
    {
      "name": "KAMRA",
      "meta": {
        "shortened": true,
        "fullName": "Kamran Akmal"
      }
    },
    {
      "name": "AKMAL",
      "meta": {
        "shortened": false,
        "fullName": "Kamran Akmal"
      }
    },
    {
      "name": "SHOAI",
      "meta": {
        "shortened": true,
        "fullName": "Shoaib Malik"
      }
    },
    {
      "name": "MALIK",
      "meta": {
        "shortened": false,
        "fullName": "Shoaib Malik"
      }
    },
    {
      "name": "ABDUL",
      "meta": {
        "shortened": false,
        "fullName": "Abdul Razzaq"
      }
    },
    {
      "name": "RAZZA",
      "meta": {
        "shortened": true,
        "fullName": "Abdul Razzaq"
      }
    },
    {
      "name": "DANIS",
      "meta": {
        "shortened": true,
        "fullName": "Danish Kaneria"
      }
    },
    {
      "name": "KANER",
      "meta": {
        "shortened": true,
        "fullName": "Danish Kaneria"
      }
    },
    {
      "name": "UMAR",
      "meta": {
        "shortened": false,
        "fullName": "Umar Gul"
      }
    },
    {
      "name": "GUL",
      "meta": {
        "shortened": false,
        "fullName": "Umar Gul"
      }
    },
    {
      "name": "SAQLA",
      "meta": {
        "shortened": true,
        "fullName": "Saqlain Mushtaq"
      }
    },
    {
      "name": "MUSHT",
      "meta": {
        "shortened": true,
        "fullName": "Saqlain Mushtaq"
      }
    },
    {
      "name": "IFTIK",
      "meta": {
        "shortened": true,
        "fullName": "Iftikhar Ahmed"
      }
    },
    {
      "name": "AHMED",
      "meta": {
        "shortened": false,
        "fullName": "Iftikhar Ahmed"
      }
    },
    {
      "name": "IMAM",
      "meta": {
        "shortened": false,
        "fullName": "Imam ul Haq"
      }
    },
    {
      "name": "UL",
      "meta": {
        "shortened": false,
        "fullName": "Imam ul Haq"
      }
    },
    {
      "name": "HAQ",
      "meta": {
        "shortened": false,
        "fullName": "Imam ul Haq"
      }
    },
    {
      "name": "ABDUL",
      "meta": {
        "shortened": true,
        "fullName": "Abdullah Shafique"
      }
    },
    {
      "name": "SHAFI",
      "meta": {
        "shortened": true,
        "fullName": "Abdullah Shafique"
      }
    },
    {
      "name": "NASEE",
      "meta": {
        "shortened": true,
        "fullName": "Naseem Shah"
      }
    },
    {
      "name": "SHAH",
      "meta": {
        "shortened": false,
        "fullName": "Naseem Shah"
      }
    },
    {
      "name": "HARIS",
      "meta": {
        "shortened": false,
        "fullName": "Haris Rauf"
      }
    },
    {
      "name": "RAUF",
      "meta": {
        "shortened": false,
        "fullName": "Haris Rauf"
      }
    },
    {
      "name": "SHADA",
      "meta": {
        "shortened": true,
        "fullName": "Shadab Khan"
      }
    },
    {
      "name": "KHAN",
      "meta": {
        "shortened": false,
        "fullName": "Shadab Khan"
      }
    },
    {
      "name": "FAHEE",
      "meta": {
        "shortened": true,
        "fullName": "Faheem Ashraf"
      }
    },
    {
      "name": "ASHRA",
      "meta": {
        "shortened": true,
        "fullName": "Faheem Ashraf"
      }
    },
    {
      "name": "AGHA",
      "meta": {
        "shortened": false,
        "fullName": "Agha Salman"
      }
    },
    {
      "name": "SALMA",
      "meta": {
        "shortened": true,
        "fullName": "Agha Salman"
      }
    },
    {
      "name": "SAUD",
      "meta": {
        "shortened": false,
        "fullName": "Saud Shakeel"
      }
    },
    {
      "name": "SHAKE",
      "meta": {
        "shortened": true,
        "fullName": "Saud Shakeel"
      }
    },
    {
      "name": "SAIM",
      "meta": {
        "shortened": false,
        "fullName": "Saim Ayub"
      }
    },
    {
      "name": "AYUB",
      "meta": {
        "shortened": false,
        "fullName": "Saim Ayub"
      }
    },
    {
      "name": "MOHAM",
      "meta": {
        "shortened": true,
        "fullName": "Mohammad Ali"
      }
    },
    {
      "name": "ALI",
      "meta": {
        "shortened": false,
        "fullName": "Mohammad Ali"
      }
    },
    {
      "name": "ABRAR",
      "meta": {
        "shortened": false,
        "fullName": "Abrar Ahmed"
      }
    },
    {
      "name": "AHMED",
      "meta": {
        "shortened": false,
        "fullName": "Abrar Ahmed"
      }
    },
    {
      "name": "USMAN",
      "meta": {
        "shortened": false,
        "fullName": "Usman Khan"
      }
    },
    {
      "name": "KHAN",
      "meta": {
        "shortened": false,
        "fullName": "Usman Khan"
      }
    },
    {
      "name": "MASHR",
      "meta": {
        "shortened": true,
        "fullName": "Mashrafe Mortaza"
      }
    },
    {
      "name": "MORTA",
      "meta": {
        "shortened": true,
        "fullName": "Mashrafe Mortaza"
      }
    },
    {
      "name": "MAHMU",
      "meta": {
        "shortened": true,
        "fullName": "Mahmudullah Riyad"
      }
    },
    {
      "name": "RIYAD",
      "meta": {
        "shortened": false,
        "fullName": "Mahmudullah Riyad"
      }
    },
    {
      "name": "LITON",
      "meta": {
        "shortened": false,
        "fullName": "Liton Das"
      }
    },
    {
      "name": "DAS",
      "meta": {
        "shortened": false,
        "fullName": "Liton Das"
      }
    },
    {
      "name": "SHORI",
      "meta": {
        "shortened": true,
        "fullName": "Shoriful Islam"
      }
    },
    {
      "name": "ISLAM",
      "meta": {
        "shortened": false,
        "fullName": "Shoriful Islam"
      }
    },
    {
      "name": "MEHID",
      "meta": {
        "shortened": true,
        "fullName": "Mehidy Hasan Miraz"
      }
    },
    {
      "name": "HASAN",
      "meta": {
        "shortened": false,
        "fullName": "Mehidy Hasan Miraz"
      }
    },
    {
      "name": "MIRAZ",
      "meta": {
        "shortened": false,
        "fullName": "Mehidy Hasan Miraz"
      }
    },
    {
      "name": "TAIJU",
      "meta": {
        "shortened": true,
        "fullName": "Taijul Islam"
      }
    },
    {
      "name": "ISLAM",
      "meta": {
        "shortened": false,
        "fullName": "Taijul Islam"
      }
    },
    {
      "name": "TANZI",
      "meta": {
        "shortened": true,
        "fullName": "Tanzid Hasan"
      }
    },
    {
      "name": "HASAN",
      "meta": {
        "shortened": false,
        "fullName": "Tanzid Hasan"
      }
    },
    {
      "name": "TOWHI",
      "meta": {
        "shortened": true,
        "fullName": "Towhid Hridoy"
      }
    },
    {
      "name": "HRIDO",
      "meta": {
        "shortened": true,
        "fullName": "Towhid Hridoy"
      }
    },
    {
      "name": "NAJMU",
      "meta": {
        "shortened": true,
        "fullName": "Najmul Hossain Shanto"
      }
    },
    {
      "name": "HOSSA",
      "meta": {
        "shortened": true,
        "fullName": "Najmul Hossain Shanto"
      }
    },
    {
      "name": "SHANT",
      "meta": {
        "shortened": true,
        "fullName": "Najmul Hossain Shanto"
      }
    },
    {
      "name": "TASKI",
      "meta": {
        "shortened": true,
        "fullName": "Taskin Ahmed"
      }
    },
    {
      "name": "AHMED",
      "meta": {
        "shortened": false,
        "fullName": "Taskin Ahmed"
      }
    },
    {
      "name": "NASUM",
      "meta": {
        "shortened": false,
        "fullName": "Nasum Ahmed"
      }
    },
    {
      "name": "AHMED",
      "meta": {
        "shortened": false,
        "fullName": "Nasum Ahmed"
      }
    },
    {
      "name": "MAHED",
      "meta": {
        "shortened": true,
        "fullName": "Mahedi Hasan"
      }
    },
    {
      "name": "HASAN",
      "meta": {
        "shortened": false,
        "fullName": "Mahedi Hasan"
      }
    },
    {
      "name": "JAKER",
      "meta": {
        "shortened": false,
        "fullName": "Jaker Ali"
      }
    },
    {
      "name": "ALI",
      "meta": {
        "shortened": false,
        "fullName": "Jaker Ali"
      }
    },
    {
      "name": "ASGHA",
      "meta": {
        "shortened": true,
        "fullName": "Asghar Afghan"
      }
    },
    {
      "name": "AFGHA",
      "meta": {
        "shortened": true,
        "fullName": "Asghar Afghan"
      }
    },
    {
      "name": "MOHAM",
      "meta": {
        "shortened": true,
        "fullName": "Mohammad Shahzad"
      }
    },
    {
      "name": "SHAHZ",
      "meta": {
        "shortened": true,
        "fullName": "Mohammad Shahzad"
      }
    },
    {
      "name": "NAWRO",
      "meta": {
        "shortened": true,
        "fullName": "Nawroz Mangal"
      }
    },
    {
      "name": "MANGA",
      "meta": {
        "shortened": true,
        "fullName": "Nawroz Mangal"
      }
    },
    {
      "name": "IBRAH",
      "meta": {
        "shortened": true,
        "fullName": "Ibrahim Zadran"
      }
    },
    {
      "name": "ZADRA",
      "meta": {
        "shortened": true,
        "fullName": "Ibrahim Zadran"
      }
    },
    {
      "name": "RAHMA",
      "meta": {
        "shortened": true,
        "fullName": "Rahmanullah Gurbaz"
      }
    },
    {
      "name": "GURBA",
      "meta": {
        "shortened": true,
        "fullName": "Rahmanullah Gurbaz"
      }
    },
    {
      "name": "AZMAT",
      "meta": {
        "shortened": true,
        "fullName": "Azmatullah Omarzai"
      }
    },
    {
      "name": "OMARZ",
      "meta": {
        "shortened": true,
        "fullName": "Azmatullah Omarzai"
      }
    },
    {
      "name": "GULBA",
      "meta": {
        "shortened": true,
        "fullName": "Gulbadin Naib"
      }
    },
    {
      "name": "NAIB",
      "meta": {
        "shortened": false,
        "fullName": "Gulbadin Naib"
      }
    },
    {
      "name": "KARIM",
      "meta": {
        "shortened": false,
        "fullName": "Karim Janat"
      }
    },
    {
      "name": "JANAT",
      "meta": {
        "shortened": false,
        "fullName": "Karim Janat"
      }
    },
    {
      "name": "FAZAL",
      "meta": {
        "shortened": true,
        "fullName": "Fazalhaq Farooqi"
      }
    },
    {
      "name": "FAROO",
      "meta": {
        "shortened": true,
        "fullName": "Fazalhaq Farooqi"
      }
    },
    {
      "name": "NOOR",
      "meta": {
        "shortened": false,
        "fullName": "Noor Ahmad"
      }
    },
    {
      "name": "AHMAD",
      "meta": {
        "shortened": false,
        "fullName": "Noor Ahmad"
      }
    },
    {
      "name": "NAVEE",
      "meta": {
        "shortened": true,
        "fullName": "Naveen ul Haq"
      }
    },
    {
      "name": "UL",
      "meta": {
        "shortened": false,
        "fullName": "Naveen ul Haq"
      }
    },
    {
      "name": "HAQ",
      "meta": {
        "shortened": false,
        "fullName": "Naveen ul Haq"
      }
    },
    {
      "name": "SIKAN",
      "meta": {
        "shortened": true,
        "fullName": "Sikandar Raza"
      }
    },
    {
      "name": "RAZA",
      "meta": {
        "shortened": false,
        "fullName": "Sikandar Raza"
      }
    },
    {
      "name": "BLESS",
      "meta": {
        "shortened": true,
        "fullName": "Blessing Muzarabani"
      }
    },
    {
      "name": "MUZAR",
      "meta": {
        "shortened": true,
        "fullName": "Blessing Muzarabani"
      }
    },
    {
      "name": "CRAIG",
      "meta": {
        "shortened": false,
        "fullName": "Craig Ervine"
      }
    },
    {
      "name": "ERVIN",
      "meta": {
        "shortened": true,
        "fullName": "Craig Ervine"
      }
    },
    {
      "name": "RYAN",
      "meta": {
        "shortened": false,
        "fullName": "Ryan Burl"
      }
    },
    {
      "name": "BURL",
      "meta": {
        "shortened": false,
        "fullName": "Ryan Burl"
      }
    },
    {
      "name": "SEAN",
      "meta": {
        "shortened": false,
        "fullName": "Sean Williams"
      }
    },
    {
      "name": "WILLI",
      "meta": {
        "shortened": true,
        "fullName": "Sean Williams"
      }
    },
    {
      "name": "REGIS",
      "meta": {
        "shortened": false,
        "fullName": "Regis Chakabva"
      }
    },
    {
      "name": "CHAKA",
      "meta": {
        "shortened": true,
        "fullName": "Regis Chakabva"
      }
    },
    {
      "name": "CLIVE",
      "meta": {
        "shortened": false,
        "fullName": "Clive Madande"
      }
    },
    {
      "name": "MADAN",
      "meta": {
        "shortened": true,
        "fullName": "Clive Madande"
      }
    },
    {
      "name": "JOSHU",
      "meta": {
        "shortened": true,
        "fullName": "Joshua Little"
      }
    },
    {
      "name": "LITTL",
      "meta": {
        "shortened": true,
        "fullName": "Joshua Little"
      }
    },
    {
      "name": "LORCA",
      "meta": {
        "shortened": true,
        "fullName": "Lorcan Tucker"
      }
    },
    {
      "name": "TUCKE",
      "meta": {
        "shortened": true,
        "fullName": "Lorcan Tucker"
      }
    },
    {
      "name": "MARK",
      "meta": {
        "shortened": false,
        "fullName": "Mark Adair"
      }
    },
    {
      "name": "ADAIR",
      "meta": {
        "shortened": false,
        "fullName": "Mark Adair"
      }
    },
    {
      "name": "CURTI",
      "meta": {
        "shortened": true,
        "fullName": "Curtis Campher"
      }
    },
    {
      "name": "CAMPH",
      "meta": {
        "shortened": true,
        "fullName": "Curtis Campher"
      }
    },
    {
      "name": "ANDRE",
      "meta": {
        "shortened": true,
        "fullName": "Andrew Balbirnie"
      }
    },
    {
      "name": "BALBI",
      "meta": {
        "shortened": true,
        "fullName": "Andrew Balbirnie"
      }
    },
    {
      "name": "GEORG",
      "meta": {
        "shortened": true,
        "fullName": "George Dockrell"
      }
    },
    {
      "name": "DOCKR",
      "meta": {
        "shortened": true,
        "fullName": "George Dockrell"
      }
    },
    {
      "name": "FIONN",
      "meta": {
        "shortened": false,
        "fullName": "Fionn Hand"
      }
    },
    {
      "name": "HAND",
      "meta": {
        "shortened": false,
        "fullName": "Fionn Hand"
      }
    },
    {
      "name": "RYAN",
      "meta": {
        "shortened": false,
        "fullName": "Ryan ten Doeschate"
      }
    },
    {
      "name": "TEN",
      "meta": {
        "shortened": false,
        "fullName": "Ryan ten Doeschate"
      }
    },
    {
      "name": "DOESC",
      "meta": {
        "shortened": true,
        "fullName": "Ryan ten Doeschate"
      }
    },
    {
      "name": "WESLE",
      "meta": {
        "shortened": true,
        "fullName": "Wesley Barresi"
      }
    },
    {
      "name": "BARRE",
      "meta": {
        "shortened": true,
        "fullName": "Wesley Barresi"
      }
    },
    {
      "name": "SCOTT",
      "meta": {
        "shortened": false,
        "fullName": "Scott Edwards"
      }
    },
    {
      "name": "EDWAR",
      "meta": {
        "shortened": true,
        "fullName": "Scott Edwards"
      }
    },
    {
      "name": "BAS",
      "meta": {
        "shortened": false,
        "fullName": "Bas de Leede"
      }
    },
    {
      "name": "DE",
      "meta": {
        "shortened": false,
        "fullName": "Bas de Leede"
      }
    },
    {
      "name": "LEEDE",
      "meta": {
        "shortened": false,
        "fullName": "Bas de Leede"
      }
    },
    {
      "name": "VIKRA",
      "meta": {
        "shortened": true,
        "fullName": "Vikramjit Singh"
      }
    },
    {
      "name": "SINGH",
      "meta": {
        "shortened": false,
        "fullName": "Vikramjit Singh"
      }
    },
    {
      "name": "LOGAN",
      "meta": {
        "shortened": false,
        "fullName": "Logan van Beek"
      }
    },
    {
      "name": "VAN",
      "meta": {
        "shortened": false,
        "fullName": "Logan van Beek"
      }
    },
    {
      "name": "BEEK",
      "meta": {
        "shortened": false,
        "fullName": "Logan van Beek"
      }
    },
    {
      "name": "PAUL",
      "meta": {
        "shortened": false,
        "fullName": "Paul van Meekeren"
      }
    },
    {
      "name": "VAN",
      "meta": {
        "shortened": false,
        "fullName": "Paul van Meekeren"
      }
    },
    {
      "name": "MEEKE",
      "meta": {
        "shortened": true,
        "fullName": "Paul van Meekeren"
      }
    },
    {
      "name": "ARYAN",
      "meta": {
        "shortened": false,
        "fullName": "Aryan Dutt"
      }
    },
    {
      "name": "DUTT",
      "meta": {
        "shortened": false,
        "fullName": "Aryan Dutt"
      }
    },
    {
      "name": "AARON",
      "meta": {
        "shortened": false,
        "fullName": "Aaron Jones"
      }
    },
    {
      "name": "JONES",
      "meta": {
        "shortened": false,
        "fullName": "Aaron Jones"
      }
    },
    {
      "name": "ANDRI",
      "meta": {
        "shortened": true,
        "fullName": "Andries Gous"
      }
    },
    {
      "name": "GOUS",
      "meta": {
        "shortened": false,
        "fullName": "Andries Gous"
      }
    },
    {
      "name": "MONAN",
      "meta": {
        "shortened": true,
        "fullName": "Monank Patel"
      }
    },
    {
      "name": "PATEL",
      "meta": {
        "shortened": false,
        "fullName": "Monank Patel"
      }
    },
    {
      "name": "SAURA",
      "meta": {
        "shortened": true,
        "fullName": "Saurabh Netravalkar"
      }
    },
    {
      "name": "NETRA",
      "meta": {
        "shortened": true,
        "fullName": "Saurabh Netravalkar"
      }
    },
    {
      "name": "HARME",
      "meta": {
        "shortened": true,
        "fullName": "Harmeet Singh"
      }
    },
    {
      "name": "SINGH",
      "meta": {
        "shortened": false,
        "fullName": "Harmeet Singh"
      }
    },
    {
      "name": "COREY",
      "meta": {
        "shortened": false,
        "fullName": "Corey Anderson"
      }
    },
    {
      "name": "ANDER",
      "meta": {
        "shortened": true,
        "fullName": "Corey Anderson"
      }
    },
    {
      "name": "GERHA",
      "meta": {
        "shortened": true,
        "fullName": "Gerhard Erasmus"
      }
    },
    {
      "name": "ERASM",
      "meta": {
        "shortened": true,
        "fullName": "Gerhard Erasmus"
      }
    },
    {
      "name": "JAN",
      "meta": {
        "shortened": false,
        "fullName": "Jan Nicol Loftie Eaton"
      }
    },
    {
      "name": "NICOL",
      "meta": {
        "shortened": false,
        "fullName": "Jan Nicol Loftie Eaton"
      }
    },
    {
      "name": "LOFTI",
      "meta": {
        "shortened": true,
        "fullName": "Jan Nicol Loftie Eaton"
      }
    },
    {
      "name": "EATON",
      "meta": {
        "shortened": false,
        "fullName": "Jan Nicol Loftie Eaton"
      }
    },
    {
      "name": "ZANE",
      "meta": {
        "shortened": false,
        "fullName": "Zane Green"
      }
    },
    {
      "name": "GREEN",
      "meta": {
        "shortened": false,
        "fullName": "Zane Green"
      }
    },
    {
      "name": "BERNA",
      "meta": {
        "shortened": true,
        "fullName": "Bernard Scholtz"
      }
    },
    {
      "name": "SCHOL",
      "meta": {
        "shortened": true,
        "fullName": "Bernard Scholtz"
      }
    },
    {
      "name": "CHAMI",
      "meta": {
        "shortened": true,
        "fullName": "Chamika Karunaratne"
      }
    },
    {
      "name": "KARUN",
      "meta": {
        "shortened": true,
        "fullName": "Chamika Karunaratne"
      }
    },
      {
        "name": "POLLY",
        "meta": {
          "shortened": false,
          "fullName": "Polly Umrigar"
        }
      },
      {
        "name": "UMRIG",
        "meta": {
          "shortened": true,
          "fullName": "Polly Umrigar"
        }
      },
      {
        "name": "VIJAY",
        "meta": {
          "shortened": false,
          "fullName": "Vijay Hazare"
        }
      },
      {
        "name": "HAZAR",
        "meta": {
          "shortened": true,
          "fullName": "Vijay Hazare"
        }
      },
      {
        "name": "VIJAY",
        "meta": {
          "shortened": false,
          "fullName": "Vijay Merchant"
        }
      },
      {
        "name": "MERCH",
        "meta": {
          "shortened": true,
          "fullName": "Vijay Merchant"
        }
      },
      {
        "name": "LALA",
        "meta": {
          "shortened": false,
          "fullName": "Lala Amarnath"
        }
      },
      {
        "name": "AMARN",
        "meta": {
          "shortened": true,
          "fullName": "Lala Amarnath"
        }
      },
      {
        "name": "CHAND",
        "meta": {
          "shortened": true,
          "fullName": "Chandu Borde"
        }
      },
      {
        "name": "BORDE",
        "meta": {
          "shortened": false,
          "fullName": "Chandu Borde"
        }
      },
      {
        "name": "ML",
        "meta": {
          "shortened": false,
          "fullName": "ML Jaisimha"
        }
      },
      {
        "name": "JAISI",
        "meta": {
          "shortened": true,
          "fullName": "ML Jaisimha"
        }
      },
      {
        "name": "HANUM",
        "meta": {
          "shortened": true,
          "fullName": "Hanumant Singh"
        }
      },
      {
        "name": "SINGH",
        "meta": {
          "shortened": false,
          "fullName": "Hanumant Singh"
        }
      },
      {
        "name": "FAROK",
        "meta": {
          "shortened": true,
          "fullName": "Farokh Engineer"
        }
      },
      {
        "name": "ENGIN",
        "meta": {
          "shortened": true,
          "fullName": "Farokh Engineer"
        }
      },
      {
        "name": "AJIT",
        "meta": {
          "shortened": false,
          "fullName": "Ajit Wadekar"
        }
      },
      {
        "name": "WADEK",
        "meta": {
          "shortened": true,
          "fullName": "Ajit Wadekar"
        }
      },
      {
        "name": "SALIM",
        "meta": {
          "shortened": false,
          "fullName": "Salim Durani"
        }
      },
      {
        "name": "DURAN",
        "meta": {
          "shortened": true,
          "fullName": "Salim Durani"
        }
      },
      {
        "name": "SANDE",
        "meta": {
          "shortened": true,
          "fullName": "Sandeep Patil"
        }
      },
      {
        "name": "PATIL",
        "meta": {
          "shortened": false,
          "fullName": "Sandeep Patil"
        }
      },
      {
        "name": "YASHP",
        "meta": {
          "shortened": true,
          "fullName": "Yashpal Sharma"
        }
      },
      {
        "name": "SHARM",
        "meta": {
          "shortened": true,
          "fullName": "Yashpal Sharma"
        }
      },
      {
        "name": "KRIS",
        "meta": {
          "shortened": false,
          "fullName": "Kris Srikkanth"
        }
      },
      {
        "name": "SRIKK",
        "meta": {
          "shortened": true,
          "fullName": "Kris Srikkanth"
        }
      },
      {
        "name": "KRISH",
        "meta": {
          "shortened": true,
          "fullName": "Krishnamachari Srikkanth"
        }
      },
      {
        "name": "SRIKK",
        "meta": {
          "shortened": true,
          "fullName": "Krishnamachari Srikkanth"
        }
      },
      {
        "name": "SANJA",
        "meta": {
          "shortened": true,
          "fullName": "Sanjay Manjrekar"
        }
      },
      {
        "name": "MANJR",
        "meta": {
          "shortened": true,
          "fullName": "Sanjay Manjrekar"
        }
      },
      {
        "name": "WOORK",
        "meta": {
          "shortened": true,
          "fullName": "Woorkeri Raman"
        }
      },
      {
        "name": "RAMAN",
        "meta": {
          "shortened": false,
          "fullName": "Woorkeri Raman"
        }
      },
      {
        "name": "DILIP",
        "meta": {
          "shortened": false,
          "fullName": "Dilip Sardesai"
        }
      },
      {
        "name": "SARDE",
        "meta": {
          "shortened": true,
          "fullName": "Dilip Sardesai"
        }
      },
      {
        "name": "HEMAN",
        "meta": {
          "shortened": true,
          "fullName": "Hemant Kanitkar"
        }
      },
      {
        "name": "KANIT",
        "meta": {
          "shortened": true,
          "fullName": "Hemant Kanitkar"
        }
      },
      {
        "name": "SUBRO",
        "meta": {
          "shortened": true,
          "fullName": "Subroto Guha"
        }
      },
      {
        "name": "GUHA",
        "meta": {
          "shortened": false,
          "fullName": "Subroto Guha"
        }
      },
      {
        "name": "KARSA",
        "meta": {
          "shortened": true,
          "fullName": "Karsan Ghavri"
        }
      },
      {
        "name": "GHAVR",
        "meta": {
          "shortened": true,
          "fullName": "Karsan Ghavri"
        }
      },
      {
        "name": "BAPU",
        "meta": {
          "shortened": false,
          "fullName": "Bapu Nadkarni"
        }
      },
      {
        "name": "NADKA",
        "meta": {
          "shortened": true,
          "fullName": "Bapu Nadkarni"
        }
      },
      {
        "name": "TIGER",
        "meta": {
          "shortened": false,
          "fullName": "Tiger Pataudi"
        }
      },
      {
        "name": "PATAU",
        "meta": {
          "shortened": true,
          "fullName": "Tiger Pataudi"
        }
      },
      {
        "name": "NAWAB",
        "meta": {
          "shortened": false,
          "fullName": "Nawab of Pataudi"
        }
      },
      {
        "name": "OF",
        "meta": {
          "shortened": false,
          "fullName": "Nawab of Pataudi"
        }
      },
      {
        "name": "PATAU",
        "meta": {
          "shortened": true,
          "fullName": "Nawab of Pataudi"
        }
      },
      {
        "name": "VIJAY",
        "meta": {
          "shortened": false,
          "fullName": "Vijay Manjrekar"
        }
      },
      {
        "name": "MANJR",
        "meta": {
          "shortened": true,
          "fullName": "Vijay Manjrekar"
        }
      },
      {
        "name": "ABBAS",
        "meta": {
          "shortened": false,
          "fullName": "Abbas Ali Baig"
        }
      },
      {
        "name": "ALI",
        "meta": {
          "shortened": false,
          "fullName": "Abbas Ali Baig"
        }
      },
      {
        "name": "BAIG",
        "meta": {
          "shortened": false,
          "fullName": "Abbas Ali Baig"
        }
      },
      {
        "name": "YUDHV",
        "meta": {
          "shortened": true,
          "fullName": "Yudhvir Singh"
        }
      },
      {
        "name": "SINGH",
        "meta": {
          "shortened": false,
          "fullName": "Yudhvir Singh"
        }
      },
      {
        "name": "SAI",
        "meta": {
          "shortened": false,
          "fullName": "Sai Kishore"
        }
      },
      {
        "name": "KISHO",
        "meta": {
          "shortened": true,
          "fullName": "Sai Kishore"
        }
      },
      {
        "name": "ANSHU",
        "meta": {
          "shortened": true,
          "fullName": "Anshul Kamboj"
        }
      },
      {
        "name": "KAMBO",
        "meta": {
          "shortened": true,
          "fullName": "Anshul Kamboj"
        }
      },
      {
        "name": "MANAV",
        "meta": {
          "shortened": false,
          "fullName": "Manav Suthar"
        }
      },
      {
        "name": "SUTHA",
        "meta": {
          "shortened": true,
          "fullName": "Manav Suthar"
        }
      },
      {
        "name": "RAMAN",
        "meta": {
          "shortened": true,
          "fullName": "Ramandeep Singh"
        }
      },
      {
        "name": "SINGH",
        "meta": {
          "shortened": false,
          "fullName": "Ramandeep Singh"
        }
      },
      {
        "name": "SHAHB",
        "meta": {
          "shortened": true,
          "fullName": "Shahbaz Ahmed"
        }
      },
      {
        "name": "AHMED",
        "meta": {
          "shortened": false,
          "fullName": "Shahbaz Ahmed"
        }
      },
      {
        "name": "SARFA",
        "meta": {
          "shortened": true,
          "fullName": "Sarfaraz Khan"
        }
      },
      {
        "name": "KHAN",
        "meta": {
          "shortened": false,
          "fullName": "Sarfaraz Khan"
        }
      },
      {
        "name": "RAHUL",
        "meta": {
          "shortened": false,
          "fullName": "Rahul Tripathi"
        }
      },
      {
        "name": "TRIPA",
        "meta": {
          "shortened": true,
          "fullName": "Rahul Tripathi"
        }
      },
      {
        "name": "VIVRA",
        "meta": {
          "shortened": true,
          "fullName": "Vivrant Sharma"
        }
      },
      {
        "name": "SHARM",
        "meta": {
          "shortened": true,
          "fullName": "Vivrant Sharma"
        }
      },
      {
        "name": "ARPIT",
        "meta": {
          "shortened": false,
          "fullName": "Arpit Vasavada"
        }
      },
      {
        "name": "VASAV",
        "meta": {
          "shortened": true,
          "fullName": "Arpit Vasavada"
        }
      },
      {
        "name": "RICKY",
        "meta": {
          "shortened": false,
          "fullName": "Ricky Bhui"
        }
      },
      {
        "name": "BHUI",
        "meta": {
          "shortened": false,
          "fullName": "Ricky Bhui"
        }
      },
      {
        "name": "AAKAS",
        "meta": {
          "shortened": true,
          "fullName": "Aakash Deep"
        }
      },
      {
        "name": "DEEP",
        "meta": {
          "shortened": false,
          "fullName": "Aakash Deep"
        }
      },
      {
        "name": "HIMAN",
        "meta": {
          "shortened": true,
          "fullName": "Himanshu Rana"
        }
      },
      {
        "name": "RANA",
        "meta": {
          "shortened": false,
          "fullName": "Himanshu Rana"
        }
      },
      {
        "name": "SUYAS",
        "meta": {
          "shortened": true,
          "fullName": "Suyash Sharma"
        }
      },
      {
        "name": "SHARM",
        "meta": {
          "shortened": true,
          "fullName": "Suyash Sharma"
        }
      },
      {
        "name": "SHIVA",
        "meta": {
          "shortened": true,
          "fullName": "Shivam Singh"
        }
      },
      {
        "name": "SINGH",
        "meta": {
          "shortened": false,
          "fullName": "Shivam Singh"
        }
      },
      {
        "name": "ARJUN",
        "meta": {
          "shortened": false,
          "fullName": "Arjun Tendulkar"
        }
      },
      {
        "name": "TENDU",
        "meta": {
          "shortened": true,
          "fullName": "Arjun Tendulkar"
        }
      },
      {
        "name": "YASH",
        "meta": {
          "shortened": false,
          "fullName": "Yash Thakur"
        }
      },
      {
        "name": "THAKU",
        "meta": {
          "shortened": true,
          "fullName": "Yash Thakur"
        }
      },
      {
        "name": "SACHI",
        "meta": {
          "shortened": true,
          "fullName": "Sachin Baby"
        }
      },
      {
        "name": "BABY",
        "meta": {
          "shortened": false,
          "fullName": "Sachin Baby"
        }
      },
      {
        "name": "ROBIN",
        "meta": {
          "shortened": false,
          "fullName": "Robin Uthappa"
        }
      },
      {
        "name": "UTHAP",
        "meta": {
          "shortened": true,
          "fullName": "Robin Uthappa"
        }
      },
      {
        "name": "AJAY",
        "meta": {
          "shortened": false,
          "fullName": "Ajay Ratra"
        }
      },
      {
        "name": "RATRA",
        "meta": {
          "shortened": false,
          "fullName": "Ajay Ratra"
        }
      },
      {
        "name": "DEEP",
        "meta": {
          "shortened": false,
          "fullName": "Deep Dasgupta"
        }
      },
      {
        "name": "DASGU",
        "meta": {
          "shortened": true,
          "fullName": "Deep Dasgupta"
        }
      },
      {
        "name": "HEMAN",
        "meta": {
          "shortened": true,
          "fullName": "Hemang Badani"
        }
      },
      {
        "name": "BADAN",
        "meta": {
          "shortened": true,
          "fullName": "Hemang Badani"
        }
      },
      {
        "name": "NIKHI",
        "meta": {
          "shortened": true,
          "fullName": "Nikhil Chopra"
        }
      },
      {
        "name": "CHOPR",
        "meta": {
          "shortened": true,
          "fullName": "Nikhil Chopra"
        }
      },
      {
        "name": "JACOB",
        "meta": {
          "shortened": false,
          "fullName": "Jacob Martin"
        }
      },
      {
        "name": "MARTI",
        "meta": {
          "shortened": true,
          "fullName": "Jacob Martin"
        }
      },
      {
        "name": "TINU",
        "meta": {
          "shortened": false,
          "fullName": "Tinu Yohannan"
        }
      },
      {
        "name": "YOHAN",
        "meta": {
          "shortened": true,
          "fullName": "Tinu Yohannan"
        }
      },
      {
        "name": "LAKSH",
        "meta": {
          "shortened": true,
          "fullName": "Lakshmipathy Balaji"
        }
      },
      {
        "name": "BALAJ",
        "meta": {
          "shortened": true,
          "fullName": "Lakshmipathy Balaji"
        }
      },
      {
        "name": "SHASH",
        "meta": {
          "shortened": true,
          "fullName": "Shashank Singh"
        }
      },
      {
        "name": "SINGH",
        "meta": {
          "shortened": false,
          "fullName": "Shashank Singh"
        }
      },
      {
        "name": "JUSTI",
        "meta": {
          "shortened": true,
          "fullName": "Justin Langer"
        }
      },
      {
        "name": "LANGE",
        "meta": {
          "shortened": true,
          "fullName": "Justin Langer"
        }
      },
      {
        "name": "IAN",
        "meta": {
          "shortened": false,
          "fullName": "Ian Chappell"
        }
      },
      {
        "name": "CHAPP",
        "meta": {
          "shortened": true,
          "fullName": "Ian Chappell"
        }
      },
      {
        "name": "GREG",
        "meta": {
          "shortened": false,
          "fullName": "Greg Chappell"
        }
      },
      {
        "name": "CHAPP",
        "meta": {
          "shortened": true,
          "fullName": "Greg Chappell"
        }
      },
      {
        "name": "DENNI",
        "meta": {
          "shortened": true,
          "fullName": "Dennis Lillee"
        }
      },
      {
        "name": "LILLE",
        "meta": {
          "shortened": true,
          "fullName": "Dennis Lillee"
        }
      },
      {
        "name": "JEFF",
        "meta": {
          "shortened": false,
          "fullName": "Jeff Thomson"
        }
      },
      {
        "name": "THOMS",
        "meta": {
          "shortened": true,
          "fullName": "Jeff Thomson"
        }
      },
      {
        "name": "RODNE",
        "meta": {
          "shortened": true,
          "fullName": "Rodney Marsh"
        }
      },
      {
        "name": "MARSH",
        "meta": {
          "shortened": false,
          "fullName": "Rodney Marsh"
        }
      },
      {
        "name": "DOUG",
        "meta": {
          "shortened": false,
          "fullName": "Doug Walters"
        }
      },
      {
        "name": "WALTE",
        "meta": {
          "shortened": true,
          "fullName": "Doug Walters"
        }
      },
      {
        "name": "KIM",
        "meta": {
          "shortened": false,
          "fullName": "Kim Hughes"
        }
      },
      {
        "name": "HUGHE",
        "meta": {
          "shortened": true,
          "fullName": "Kim Hughes"
        }
      },
      {
        "name": "ALLAN",
        "meta": {
          "shortened": false,
          "fullName": "Allan Border"
        }
      },
      {
        "name": "BORDE",
        "meta": {
          "shortened": true,
          "fullName": "Allan Border"
        }
      },
      {
        "name": "MARK",
        "meta": {
          "shortened": false,
          "fullName": "Mark Taylor"
        }
      },
      {
        "name": "TAYLO",
        "meta": {
          "shortened": true,
          "fullName": "Mark Taylor"
        }
      },
      {
        "name": "MARK",
        "meta": {
          "shortened": false,
          "fullName": "Mark Waugh"
        }
      },
      {
        "name": "WAUGH",
        "meta": {
          "shortened": false,
          "fullName": "Mark Waugh"
        }
      },
      {
        "name": "STEVE",
        "meta": {
          "shortened": false,
          "fullName": "Steve Waugh"
        }
      },
      {
        "name": "WAUGH",
        "meta": {
          "shortened": false,
          "fullName": "Steve Waugh"
        }
      },
      {
        "name": "MERV",
        "meta": {
          "shortened": false,
          "fullName": "Merv Hughes"
        }
      },
      {
        "name": "HUGHE",
        "meta": {
          "shortened": true,
          "fullName": "Merv Hughes"
        }
      },
      {
        "name": "CRAIG",
        "meta": {
          "shortened": false,
          "fullName": "Craig McDermott"
        }
      },
      {
        "name": "MCDER",
        "meta": {
          "shortened": true,
          "fullName": "Craig McDermott"
        }
      },
      {
        "name": "PAUL",
        "meta": {
          "shortened": false,
          "fullName": "Paul Reiffel"
        }
      },
      {
        "name": "REIFF",
        "meta": {
          "shortened": true,
          "fullName": "Paul Reiffel"
        }
      },
      {
        "name": "DARRE",
        "meta": {
          "shortened": true,
          "fullName": "Darren Lehmann"
        }
      },
      {
        "name": "LEHMA",
        "meta": {
          "shortened": true,
          "fullName": "Darren Lehmann"
        }
      },
      {
        "name": "MICHA",
        "meta": {
          "shortened": true,
          "fullName": "Michael Bevan"
        }
      },
      {
        "name": "BEVAN",
        "meta": {
          "shortened": false,
          "fullName": "Michael Bevan"
        }
      },
      {
        "name": "DEAN",
        "meta": {
          "shortened": false,
          "fullName": "Dean Jones"
        }
      },
      {
        "name": "JONES",
        "meta": {
          "shortened": false,
          "fullName": "Dean Jones"
        }
      },
      {
        "name": "TOM",
        "meta": {
          "shortened": false,
          "fullName": "Tom Rogers"
        }
      },
      {
        "name": "ROGER",
        "meta": {
          "shortened": true,
          "fullName": "Tom Rogers"
        }
      },
      {
        "name": "OLIVE",
        "meta": {
          "shortened": true,
          "fullName": "Oliver Davies"
        }
      },
      {
        "name": "DAVIE",
        "meta": {
          "shortened": true,
          "fullName": "Oliver Davies"
        }
      },
      {
        "name": "XAVIE",
        "meta": {
          "shortened": true,
          "fullName": "Xavier Bartlett"
        }
      },
      {
        "name": "BARTL",
        "meta": {
          "shortened": true,
          "fullName": "Xavier Bartlett"
        }
      },
      {
        "name": "MATT",
        "meta": {
          "shortened": false,
          "fullName": "Matt Kuhnemann"
        }
      },
      {
        "name": "KUHNE",
        "meta": {
          "shortened": true,
          "fullName": "Matt Kuhnemann"
        }
      },
      {
        "name": "TANVE",
        "meta": {
          "shortened": true,
          "fullName": "Tanveer Sangha"
        }
      },
      {
        "name": "SANGH",
        "meta": {
          "shortened": true,
          "fullName": "Tanveer Sangha"
        }
      },
      {
        "name": "JOSH",
        "meta": {
          "shortened": false,
          "fullName": "Josh Inglis"
        }
      },
      {
        "name": "INGLI",
        "meta": {
          "shortened": true,
          "fullName": "Josh Inglis"
        }
      },
      {
        "name": "MITCH",
        "meta": {
          "shortened": false,
          "fullName": "Mitch Marsh"
        }
      },
      {
        "name": "MARSH",
        "meta": {
          "shortened": false,
          "fullName": "Mitch Marsh"
        }
      },
      {
        "name": "GLENN",
        "meta": {
          "shortened": false,
          "fullName": "Glenn Maxwell"
        }
      },
      {
        "name": "MAXWE",
        "meta": {
          "shortened": true,
          "fullName": "Glenn Maxwell"
        }
      },
      {
        "name": "TIM",
        "meta": {
          "shortened": false,
          "fullName": "Tim David"
        }
      },
      {
        "name": "DAVID",
        "meta": {
          "shortened": false,
          "fullName": "Tim David"
        }
      },
      {
        "name": "GEOFF",
        "meta": {
          "shortened": true,
          "fullName": "Geoffrey Boycott"
        }
      },
      {
        "name": "BOYCO",
        "meta": {
          "shortened": true,
          "fullName": "Geoffrey Boycott"
        }
      },
      {
        "name": "DAVID",
        "meta": {
          "shortened": false,
          "fullName": "David Gower"
        }
      },
      {
        "name": "GOWER",
        "meta": {
          "shortened": false,
          "fullName": "David Gower"
        }
      },
      {
        "name": "MIKE",
        "meta": {
          "shortened": false,
          "fullName": "Mike Gatting"
        }
      },
      {
        "name": "GATTI",
        "meta": {
          "shortened": true,
          "fullName": "Mike Gatting"
        }
      },
      {
        "name": "ALLAN",
        "meta": {
          "shortened": false,
          "fullName": "Allan Lamb"
        }
      },
      {
        "name": "LAMB",
        "meta": {
          "shortened": false,
          "fullName": "Allan Lamb"
        }
      },
      {
        "name": "ROBIN",
        "meta": {
          "shortened": false,
          "fullName": "Robin Smith"
        }
      },
      {
        "name": "SMITH",
        "meta": {
          "shortened": false,
          "fullName": "Robin Smith"
        }
      },
      {
        "name": "ANGUS",
        "meta": {
          "shortened": false,
          "fullName": "Angus Fraser"
        }
      },
      {
        "name": "FRASE",
        "meta": {
          "shortened": true,
          "fullName": "Angus Fraser"
        }
      },
      {
        "name": "DEVON",
        "meta": {
          "shortened": false,
          "fullName": "Devon Malcolm"
        }
      },
      {
        "name": "MALCO",
        "meta": {
          "shortened": true,
          "fullName": "Devon Malcolm"
        }
      },
      {
        "name": "DOMIN",
        "meta": {
          "shortened": true,
          "fullName": "Dominic Cork"
        }
      },
      {
        "name": "CORK",
        "meta": {
          "shortened": false,
          "fullName": "Dominic Cork"
        }
      },
      {
        "name": "MARK",
        "meta": {
          "shortened": false,
          "fullName": "Mark Ramprakash"
        }
      },
      {
        "name": "RAMPR",
        "meta": {
          "shortened": true,
          "fullName": "Mark Ramprakash"
        }
      },
      {
        "name": "ALEC",
        "meta": {
          "shortened": false,
          "fullName": "Alec Stewart"
        }
      },
      {
        "name": "STEWA",
        "meta": {
          "shortened": true,
          "fullName": "Alec Stewart"
        }
      },
      {
        "name": "MIKE",
        "meta": {
          "shortened": false,
          "fullName": "Mike Atherton"
        }
      },
      {
        "name": "ATHER",
        "meta": {
          "shortened": true,
          "fullName": "Mike Atherton"
        }
      },
      {
        "name": "PHIL",
        "meta": {
          "shortened": false,
          "fullName": "Phil Edmonds"
        }
      },
      {
        "name": "EDMON",
        "meta": {
          "shortened": true,
          "fullName": "Phil Edmonds"
        }
      },
      {
        "name": "JOHN",
        "meta": {
          "shortened": false,
          "fullName": "John Emburey"
        }
      },
      {
        "name": "EMBUR",
        "meta": {
          "shortened": true,
          "fullName": "John Emburey"
        }
      },
      {
        "name": "PHIL",
        "meta": {
          "shortened": false,
          "fullName": "Phil Defreitas"
        }
      },
      {
        "name": "DEFRE",
        "meta": {
          "shortened": true,
          "fullName": "Phil Defreitas"
        }
      },
      {
        "name": "OWAIS",
        "meta": {
          "shortened": false,
          "fullName": "Owais Shah"
        }
      },
      {
        "name": "SHAH",
        "meta": {
          "shortened": false,
          "fullName": "Owais Shah"
        }
      },
      {
        "name": "MARCU",
        "meta": {
          "shortened": true,
          "fullName": "Marcus Trescothick"
        }
      },
      {
        "name": "TRESC",
        "meta": {
          "shortened": true,
          "fullName": "Marcus Trescothick"
        }
      },
      {
        "name": "GERAI",
        "meta": {
          "shortened": true,
          "fullName": "Geraint Jones"
        }
      },
      {
        "name": "JONES",
        "meta": {
          "shortened": false,
          "fullName": "Geraint Jones"
        }
      },
      {
        "name": "MATTH",
        "meta": {
          "shortened": true,
          "fullName": "Matthew Hoggard"
        }
      },
      {
        "name": "HOGGA",
        "meta": {
          "shortened": true,
          "fullName": "Matthew Hoggard"
        }
      },
      {
        "name": "SIMON",
        "meta": {
          "shortened": false,
          "fullName": "Simon Jones"
        }
      },
      {
        "name": "JONES",
        "meta": {
          "shortened": false,
          "fullName": "Simon Jones"
        }
      },
      {
        "name": "STEVE",
        "meta": {
          "shortened": false,
          "fullName": "Steve Harmison"
        }
      },
      {
        "name": "HARMI",
        "meta": {
          "shortened": true,
          "fullName": "Steve Harmison"
        }
      },
      {
        "name": "OLLIE",
        "meta": {
          "shortened": false,
          "fullName": "Ollie Robinson"
        }
      },
      {
        "name": "ROBIN",
        "meta": {
          "shortened": true,
          "fullName": "Ollie Robinson"
        }
      },
      {
        "name": "DAN",
        "meta": {
          "shortened": false,
          "fullName": "Dan Lawrence"
        }
      },
      {
        "name": "LAWRE",
        "meta": {
          "shortened": true,
          "fullName": "Dan Lawrence"
        }
      },
      {
        "name": "SAM",
        "meta": {
          "shortened": false,
          "fullName": "Sam Curran"
        }
      },
      {
        "name": "CURRA",
        "meta": {
          "shortened": true,
          "fullName": "Sam Curran"
        }
      },
      {
        "name": "TOM",
        "meta": {
          "shortened": false,
          "fullName": "Tom Curran"
        }
      },
      {
        "name": "CURRA",
        "meta": {
          "shortened": true,
          "fullName": "Tom Curran"
        }
      },
      {
        "name": "REHAN",
        "meta": {
          "shortened": false,
          "fullName": "Rehan Ahmed"
        }
      },
      {
        "name": "AHMED",
        "meta": {
          "shortened": false,
          "fullName": "Rehan Ahmed"
        }
      },
      {
        "name": "JAMIE",
        "meta": {
          "shortened": false,
          "fullName": "Jamie Smith"
        }
      },
      {
        "name": "SMITH",
        "meta": {
          "shortened": false,
          "fullName": "Jamie Smith"
        }
      },
      {
        "name": "JOSH",
        "meta": {
          "shortened": false,
          "fullName": "Josh Hull"
        }
      },
      {
        "name": "HULL",
        "meta": {
          "shortened": false,
          "fullName": "Josh Hull"
        }
      },
      {
        "name": "JOEL",
        "meta": {
          "shortened": false,
          "fullName": "Joel Garner"
        }
      },
      {
        "name": "GARNE",
        "meta": {
          "shortened": true,
          "fullName": "Joel Garner"
        }
      },
      {
        "name": "MICHA",
        "meta": {
          "shortened": true,
          "fullName": "Michael Holding"
        }
      },
      {
        "name": "HOLDI",
        "meta": {
          "shortened": true,
          "fullName": "Michael Holding"
        }
      },
      {
        "name": "ANDY",
        "meta": {
          "shortened": false,
          "fullName": "Andy Roberts"
        }
      },
      {
        "name": "ROBER",
        "meta": {
          "shortened": true,
          "fullName": "Andy Roberts"
        }
      },
      {
        "name": "COLIN",
        "meta": {
          "shortened": false,
          "fullName": "Colin Croft"
        }
      },
      {
        "name": "CROFT",
        "meta": {
          "shortened": false,
          "fullName": "Colin Croft"
        }
      },
      {
        "name": "JEFFR",
        "meta": {
          "shortened": true,
          "fullName": "Jeffrey Dujon"
        }
      },
      {
        "name": "DUJON",
        "meta": {
          "shortened": false,
          "fullName": "Jeffrey Dujon"
        }
      },
      {
        "name": "LARRY",
        "meta": {
          "shortened": false,
          "fullName": "Larry Gomes"
        }
      },
      {
        "name": "GOMES",
        "meta": {
          "shortened": false,
          "fullName": "Larry Gomes"
        }
      },
      {
        "name": "RICHI",
        "meta": {
          "shortened": true,
          "fullName": "Richie Richardson"
        }
      },
      {
        "name": "RICHA",
        "meta": {
          "shortened": true,
          "fullName": "Richie Richardson"
        }
      },
      {
        "name": "KEITH",
        "meta": {
          "shortened": false,
          "fullName": "Keith Arthurton"
        }
      },
      {
        "name": "ARTHU",
        "meta": {
          "shortened": true,
          "fullName": "Keith Arthurton"
        }
      },
      {
        "name": "WINST",
        "meta": {
          "shortened": true,
          "fullName": "Winston Benjamin"
        }
      },
      {
        "name": "BENJA",
        "meta": {
          "shortened": true,
          "fullName": "Winston Benjamin"
        }
      },
      {
        "name": "PHIL",
        "meta": {
          "shortened": false,
          "fullName": "Phil Simmons"
        }
      },
      {
        "name": "SIMMO",
        "meta": {
          "shortened": true,
          "fullName": "Phil Simmons"
        }
      },
      {
        "name": "ROGER",
        "meta": {
          "shortened": false,
          "fullName": "Roger Harper"
        }
      },
      {
        "name": "HARPE",
        "meta": {
          "shortened": true,
          "fullName": "Roger Harper"
        }
      },
      {
        "name": "OTTIS",
        "meta": {
          "shortened": false,
          "fullName": "Ottis Gibson"
        }
      },
      {
        "name": "GIBSO",
        "meta": {
          "shortened": true,
          "fullName": "Ottis Gibson"
        }
      },
      {
        "name": "PEDRO",
        "meta": {
          "shortened": false,
          "fullName": "Pedro Collins"
        }
      },
      {
        "name": "COLLI",
        "meta": {
          "shortened": true,
          "fullName": "Pedro Collins"
        }
      },
      {
        "name": "IAN",
        "meta": {
          "shortened": false,
          "fullName": "Ian Bishop"
        }
      },
      {
        "name": "BISHO",
        "meta": {
          "shortened": true,
          "fullName": "Ian Bishop"
        }
      },
      {
        "name": "CARL",
        "meta": {
          "shortened": false,
          "fullName": "Carl Braithwaite"
        }
      },
      {
        "name": "BRAIT",
        "meta": {
          "shortened": true,
          "fullName": "Carl Braithwaite"
        }
      },
      {
        "name": "ROMAR",
        "meta": {
          "shortened": true,
          "fullName": "Romario Shepherd"
        }
      },
      {
        "name": "SHEPH",
        "meta": {
          "shortened": true,
          "fullName": "Romario Shepherd"
        }
      },
      {
        "name": "SHAI",
        "meta": {
          "shortened": false,
          "fullName": "Shai Hope"
        }
      },
      {
        "name": "HOPE",
        "meta": {
          "shortened": false,
          "fullName": "Shai Hope"
        }
      },
      {
        "name": "KEACY",
        "meta": {
          "shortened": false,
          "fullName": "Keacy Carty"
        }
      },
      {
        "name": "CARTY",
        "meta": {
          "shortened": false,
          "fullName": "Keacy Carty"
        }
      },
      {
        "name": "ALICK",
        "meta": {
          "shortened": false,
          "fullName": "Alick Athanaze"
        }
      },
      {
        "name": "ATHAN",
        "meta": {
          "shortened": true,
          "fullName": "Alick Athanaze"
        }
      },
      {
        "name": "TERRA",
        "meta": {
          "shortened": true,
          "fullName": "Terrance Hinds"
        }
      },
      {
        "name": "HINDS",
        "meta": {
          "shortened": false,
          "fullName": "Terrance Hinds"
        }
      },
      {
        "name": "BARRY",
        "meta": {
          "shortened": false,
          "fullName": "Barry Richards"
        }
      },
      {
        "name": "RICHA",
        "meta": {
          "shortened": true,
          "fullName": "Barry Richards"
        }
      },
      {
        "name": "MIKE",
        "meta": {
          "shortened": false,
          "fullName": "Mike Procter"
        }
      },
      {
        "name": "PROCT",
        "meta": {
          "shortened": true,
          "fullName": "Mike Procter"
        }
      },
      {
        "name": "CLIVE",
        "meta": {
          "shortened": false,
          "fullName": "Clive Rice"
        }
      },
      {
        "name": "RICE",
        "meta": {
          "shortened": false,
          "fullName": "Clive Rice"
        }
      },
      {
        "name": "PETER",
        "meta": {
          "shortened": false,
          "fullName": "Peter Pollock"
        }
      },
      {
        "name": "POLLO",
        "meta": {
          "shortened": true,
          "fullName": "Peter Pollock"
        }
      },
      {
        "name": "GRAEM",
        "meta": {
          "shortened": true,
          "fullName": "Graeme Pollock"
        }
      },
      {
        "name": "POLLO",
        "meta": {
          "shortened": true,
          "fullName": "Graeme Pollock"
        }
      },
      {
        "name": "KEPLE",
        "meta": {
          "shortened": true,
          "fullName": "Kepler Wessels"
        }
      },
      {
        "name": "WESSE",
        "meta": {
          "shortened": true,
          "fullName": "Kepler Wessels"
        }
      },
      {
        "name": "HANSI",
        "meta": {
          "shortened": true,
          "fullName": "Hansie Cronje"
        }
      },
      {
        "name": "CRONJ",
        "meta": {
          "shortened": true,
          "fullName": "Hansie Cronje"
        }
      },
      {
        "name": "BRIAN",
        "meta": {
          "shortened": false,
          "fullName": "Brian McMillan"
        }
      },
      {
        "name": "MCMIL",
        "meta": {
          "shortened": true,
          "fullName": "Brian McMillan"
        }
      },
      {
        "name": "DARYL",
        "meta": {
          "shortened": true,
          "fullName": "Daryll Cullinan"
        }
      },
      {
        "name": "CULLI",
        "meta": {
          "shortened": true,
          "fullName": "Daryll Cullinan"
        }
      },
      {
        "name": "NICKY",
        "meta": {
          "shortened": false,
          "fullName": "Nicky Boje"
        }
      },
      {
        "name": "BOJE",
        "meta": {
          "shortened": false,
          "fullName": "Nicky Boje"
        }
      },
      {
        "name": "SHAUN",
        "meta": {
          "shortened": false,
          "fullName": "Shaun Tait"
        }
      },
      {
        "name": "TAIT",
        "meta": {
          "shortened": false,
          "fullName": "Shaun Tait"
        }
      },
      {
        "name": "MORNE",
        "meta": {
          "shortened": false,
          "fullName": "Morne Morkel"
        }
      },
      {
        "name": "MORKE",
        "meta": {
          "shortened": true,
          "fullName": "Morne Morkel"
        }
      },
      {
        "name": "VERNO",
        "meta": {
          "shortened": true,
          "fullName": "Vernon Philander"
        }
      },
      {
        "name": "PHILA",
        "meta": {
          "shortened": true,
          "fullName": "Vernon Philander"
        }
      },
      {
        "name": "ROBIN",
        "meta": {
          "shortened": false,
          "fullName": "Robin Peterson"
        }
      },
      {
        "name": "PETER",
        "meta": {
          "shortened": true,
          "fullName": "Robin Peterson"
        }
      },
      {
        "name": "JEAN",
        "meta": {
          "shortened": false,
          "fullName": "Jean Paul Duminy"
        }
      },
      {
        "name": "PAUL",
        "meta": {
          "shortened": false,
          "fullName": "Jean Paul Duminy"
        }
      },
      {
        "name": "DUMIN",
        "meta": {
          "shortened": true,
          "fullName": "Jean Paul Duminy"
        }
      },
      {
        "name": "ALBIE",
        "meta": {
          "shortened": false,
          "fullName": "Albie Morkel"
        }
      },
      {
        "name": "MORKE",
        "meta": {
          "shortened": true,
          "fullName": "Albie Morkel"
        }
      },
      {
        "name": "HASHI",
        "meta": {
          "shortened": true,
          "fullName": "Hashim Amla"
        }
      },
      {
        "name": "AMLA",
        "meta": {
          "shortened": false,
          "fullName": "Hashim Amla"
        }
      },
      {
        "name": "AIDEN",
        "meta": {
          "shortened": false,
          "fullName": "Aiden Markram"
        }
      },
      {
        "name": "MARKR",
        "meta": {
          "shortened": true,
          "fullName": "Aiden Markram"
        }
      },
      {
        "name": "DAVID",
        "meta": {
          "shortened": false,
          "fullName": "David Bedingham"
        }
      },
      {
        "name": "BEDIN",
        "meta": {
          "shortened": true,
          "fullName": "David Bedingham"
        }
      },
      {
        "name": "MATTH",
        "meta": {
          "shortened": true,
          "fullName": "Matthew Breetzke"
        }
      },
      {
        "name": "BREET",
        "meta": {
          "shortened": true,
          "fullName": "Matthew Breetzke"
        }
      },
      {
        "name": "DONOV",
        "meta": {
          "shortened": true,
          "fullName": "Donovan Ferreira"
        }
      },
      {
        "name": "FERRE",
        "meta": {
          "shortened": true,
          "fullName": "Donovan Ferreira"
        }
      },
      {
        "name": "JOHN",
        "meta": {
          "shortened": false,
          "fullName": "John Reid"
        }
      },
      {
        "name": "REID",
        "meta": {
          "shortened": false,
          "fullName": "John Reid"
        }
      },
      {
        "name": "BERT",
        "meta": {
          "shortened": false,
          "fullName": "Bert Sutcliffe"
        }
      },
      {
        "name": "SUTCL",
        "meta": {
          "shortened": true,
          "fullName": "Bert Sutcliffe"
        }
      },
      {
        "name": "RICHA",
        "meta": {
          "shortened": true,
          "fullName": "Richard Hadlee"
        }
      },
      {
        "name": "HADLE",
        "meta": {
          "shortened": true,
          "fullName": "Richard Hadlee"
        }
      },
      {
        "name": "JEREM",
        "meta": {
          "shortened": true,
          "fullName": "Jeremy Coney"
        }
      },
      {
        "name": "CONEY",
        "meta": {
          "shortened": false,
          "fullName": "Jeremy Coney"
        }
      },
      {
        "name": "JOHN",
        "meta": {
          "shortened": false,
          "fullName": "John Wright"
        }
      },
      {
        "name": "WRIGH",
        "meta": {
          "shortened": true,
          "fullName": "John Wright"
        }
      },
      {
        "name": "MARK",
        "meta": {
          "shortened": false,
          "fullName": "Mark Greatbatch"
        }
      },
      {
        "name": "GREAT",
        "meta": {
          "shortened": true,
          "fullName": "Mark Greatbatch"
        }
      },
      {
        "name": "ANDRE",
        "meta": {
          "shortened": true,
          "fullName": "Andrew Jones"
        }
      },
      {
        "name": "JONES",
        "meta": {
          "shortened": false,
          "fullName": "Andrew Jones"
        }
      },
      {
        "name": "DIPAK",
        "meta": {
          "shortened": false,
          "fullName": "Dipak Patel"
        }
      },
      {
        "name": "PATEL",
        "meta": {
          "shortened": false,
          "fullName": "Dipak Patel"
        }
      },
      {
        "name": "CHRIS",
        "meta": {
          "shortened": false,
          "fullName": "Chris Pringle"
        }
      },
      {
        "name": "PRING",
        "meta": {
          "shortened": true,
          "fullName": "Chris Pringle"
        }
      },
      {
        "name": "DION",
        "meta": {
          "shortened": false,
          "fullName": "Dion Nash"
        }
      },
      {
        "name": "NASH",
        "meta": {
          "shortened": false,
          "fullName": "Dion Nash"
        }
      },
      {
        "name": "SCOTT",
        "meta": {
          "shortened": false,
          "fullName": "Scott Styris"
        }
      },
      {
        "name": "STYRI",
        "meta": {
          "shortened": true,
          "fullName": "Scott Styris"
        }
      },
      {
        "name": "JACOB",
        "meta": {
          "shortened": false,
          "fullName": "Jacob Duffy"
        }
      },
      {
        "name": "DUFFY",
        "meta": {
          "shortened": false,
          "fullName": "Jacob Duffy"
        }
      },
      {
        "name": "WILL",
        "meta": {
          "shortened": false,
          "fullName": "Will O Rourke"
        }
      },
      {
        "name": "O",
        "meta": {
          "shortened": false,
          "fullName": "Will O Rourke"
        }
      },
      {
        "name": "ROURK",
        "meta": {
          "shortened": true,
          "fullName": "Will O Rourke"
        }
      },
      {
        "name": "ZAK",
        "meta": {
          "shortened": false,
          "fullName": "Zak Foulkes"
        }
      },
      {
        "name": "FOULK",
        "meta": {
          "shortened": true,
          "fullName": "Zak Foulkes"
        }
      },
      {
        "name": "DULEE",
        "meta": {
          "shortened": true,
          "fullName": "Duleep Mendis"
        }
      },
      {
        "name": "MENDI",
        "meta": {
          "shortened": true,
          "fullName": "Duleep Mendis"
        }
      },
      {
        "name": "BREND",
        "meta": {
          "shortened": true,
          "fullName": "Brendon Kuruppu"
        }
      },
      {
        "name": "KURUP",
        "meta": {
          "shortened": true,
          "fullName": "Brendon Kuruppu"
        }
      },
      {
        "name": "ROY",
        "meta": {
          "shortened": false,
          "fullName": "Roy Dias"
        }
      },
      {
        "name": "DIAS",
        "meta": {
          "shortened": false,
          "fullName": "Roy Dias"
        }
      },
      {
        "name": "RANJA",
        "meta": {
          "shortened": true,
          "fullName": "Ranjan Madugalle"
        }
      },
      {
        "name": "MADUG",
        "meta": {
          "shortened": true,
          "fullName": "Ranjan Madugalle"
        }
      },
      {
        "name": "ASANT",
        "meta": {
          "shortened": true,
          "fullName": "Asantha de Mel"
        }
      },
      {
        "name": "DE",
        "meta": {
          "shortened": false,
          "fullName": "Asantha de Mel"
        }
      },
      {
        "name": "MEL",
        "meta": {
          "shortened": false,
          "fullName": "Asantha de Mel"
        }
      },
      {
        "name": "HASHA",
        "meta": {
          "shortened": true,
          "fullName": "Hashan Tillakaratne"
        }
      },
      {
        "name": "TILLA",
        "meta": {
          "shortened": true,
          "fullName": "Hashan Tillakaratne"
        }
      },
      {
        "name": "PRAMO",
        "meta": {
          "shortened": true,
          "fullName": "Pramodya Wickramasinghe"
        }
      },
      {
        "name": "WICKR",
        "meta": {
          "shortened": true,
          "fullName": "Pramodya Wickramasinghe"
        }
      },
      {
        "name": "RUSSE",
        "meta": {
          "shortened": true,
          "fullName": "Russel Arnold"
        }
      },
      {
        "name": "ARNOL",
        "meta": {
          "shortened": true,
          "fullName": "Russel Arnold"
        }
      },
      {
        "name": "UPUL",
        "meta": {
          "shortened": false,
          "fullName": "Upul Tharanga"
        }
      },
      {
        "name": "THARA",
        "meta": {
          "shortened": true,
          "fullName": "Upul Tharanga"
        }
      },
      {
        "name": "NUWAN",
        "meta": {
          "shortened": false,
          "fullName": "Nuwan Kulasekara"
        }
      },
      {
        "name": "KULAS",
        "meta": {
          "shortened": true,
          "fullName": "Nuwan Kulasekara"
        }
      },
      {
        "name": "SURAN",
        "meta": {
          "shortened": true,
          "fullName": "Suranga Lakmal"
        }
      },
      {
        "name": "LAKMA",
        "meta": {
          "shortened": true,
          "fullName": "Suranga Lakmal"
        }
      },
      {
        "name": "MILIN",
        "meta": {
          "shortened": true,
          "fullName": "Milinda Siriwardana"
        }
      },
      {
        "name": "SIRIW",
        "meta": {
          "shortened": true,
          "fullName": "Milinda Siriwardana"
        }
      },
      {
        "name": "KUSAL",
        "meta": {
          "shortened": false,
          "fullName": "Kusal Perera"
        }
      },
      {
        "name": "PERER",
        "meta": {
          "shortened": true,
          "fullName": "Kusal Perera"
        }
      },
      {
        "name": "NIROS",
        "meta": {
          "shortened": true,
          "fullName": "Niroshan Dickwella"
        }
      },
      {
        "name": "DICKW",
        "meta": {
          "shortened": true,
          "fullName": "Niroshan Dickwella"
        }
      },
      {
        "name": "BHANU",
        "meta": {
          "shortened": true,
          "fullName": "Bhanuka Rajapaksa"
        }
      },
      {
        "name": "RAJAP",
        "meta": {
          "shortened": true,
          "fullName": "Bhanuka Rajapaksa"
        }
      },
      {
        "name": "BINUR",
        "meta": {
          "shortened": true,
          "fullName": "Binura Fernando"
        }
      },
      {
        "name": "FERNA",
        "meta": {
          "shortened": true,
          "fullName": "Binura Fernando"
        }
      },
      {
        "name": "PRABA",
        "meta": {
          "shortened": true,
          "fullName": "Prabath Jayasuriya"
        }
      },
      {
        "name": "JAYAS",
        "meta": {
          "shortened": true,
          "fullName": "Prabath Jayasuriya"
        }
      },
      {
        "name": "HANIF",
        "meta": {
          "shortened": false,
          "fullName": "Hanif Mohammad"
        }
      },
      {
        "name": "MOHAM",
        "meta": {
          "shortened": true,
          "fullName": "Hanif Mohammad"
        }
      },
      {
        "name": "ZAHID",
        "meta": {
          "shortened": false,
          "fullName": "Zahid Fazal"
        }
      },
      {
        "name": "FAZAL",
        "meta": {
          "shortened": false,
          "fullName": "Zahid Fazal"
        }
      },
      {
        "name": "ASIF",
        "meta": {
          "shortened": false,
          "fullName": "Asif Iqbal"
        }
      },
      {
        "name": "IQBAL",
        "meta": {
          "shortened": false,
          "fullName": "Asif Iqbal"
        }
      },
      {
        "name": "MUSHT",
        "meta": {
          "shortened": true,
          "fullName": "Mushtaq Mohammad"
        }
      },
      {
        "name": "MOHAM",
        "meta": {
          "shortened": true,
          "fullName": "Mushtaq Mohammad"
        }
      },
      {
        "name": "MAJID",
        "meta": {
          "shortened": false,
          "fullName": "Majid Khan"
        }
      },
      {
        "name": "KHAN",
        "meta": {
          "shortened": false,
          "fullName": "Majid Khan"
        }
      },
      {
        "name": "ZAHEE",
        "meta": {
          "shortened": true,
          "fullName": "Zaheer Abbas"
        }
      },
      {
        "name": "ABBAS",
        "meta": {
          "shortened": false,
          "fullName": "Zaheer Abbas"
        }
      },
      {
        "name": "RAMIZ",
        "meta": {
          "shortened": false,
          "fullName": "Ramiz Raja"
        }
      },
      {
        "name": "RAJA",
        "meta": {
          "shortened": false,
          "fullName": "Ramiz Raja"
        }
      },
      {
        "name": "SALEE",
        "meta": {
          "shortened": true,
          "fullName": "Saleem Malik"
        }
      },
      {
        "name": "MALIK",
        "meta": {
          "shortened": false,
          "fullName": "Saleem Malik"
        }
      },
      {
        "name": "AAMIR",
        "meta": {
          "shortened": false,
          "fullName": "Aamir Sohail"
        }
      },
      {
        "name": "SOHAI",
        "meta": {
          "shortened": true,
          "fullName": "Aamir Sohail"
        }
      },
      {
        "name": "RAMEE",
        "meta": {
          "shortened": true,
          "fullName": "Rameez Raja"
        }
      },
      {
        "name": "RAJA",
        "meta": {
          "shortened": false,
          "fullName": "Rameez Raja"
        }
      },
      {
        "name": "IJAZ",
        "meta": {
          "shortened": false,
          "fullName": "Ijaz Ahmed"
        }
      },
      {
        "name": "AHMED",
        "meta": {
          "shortened": false,
          "fullName": "Ijaz Ahmed"
        }
      },
      {
        "name": "MOHAM",
        "meta": {
          "shortened": true,
          "fullName": "Mohammad Hafeez"
        }
      },
      {
        "name": "HAFEE",
        "meta": {
          "shortened": true,
          "fullName": "Mohammad Hafeez"
        }
      },
      {
        "name": "ASAD",
        "meta": {
          "shortened": false,
          "fullName": "Asad Shafiq"
        }
      },
      {
        "name": "SHAFI",
        "meta": {
          "shortened": true,
          "fullName": "Asad Shafiq"
        }
      },
      {
        "name": "AZHAR",
        "meta": {
          "shortened": false,
          "fullName": "Azhar Ali"
        }
      },
      {
        "name": "ALI",
        "meta": {
          "shortened": false,
          "fullName": "Azhar Ali"
        }
      },
      {
        "name": "FAWAD",
        "meta": {
          "shortened": false,
          "fullName": "Fawad Alam"
        }
      },
      {
        "name": "ALAM",
        "meta": {
          "shortened": false,
          "fullName": "Fawad Alam"
        }
      },
      {
        "name": "MOHAM",
        "meta": {
          "shortened": true,
          "fullName": "Mohammad Amir"
        }
      },
      {
        "name": "AMIR",
        "meta": {
          "shortened": false,
          "fullName": "Mohammad Amir"
        }
      },
      {
        "name": "JUNAI",
        "meta": {
          "shortened": true,
          "fullName": "Junaid Khan"
        }
      },
      {
        "name": "KHAN",
        "meta": {
          "shortened": false,
          "fullName": "Junaid Khan"
        }
      },
      {
        "name": "WAHAB",
        "meta": {
          "shortened": false,
          "fullName": "Wahab Riaz"
        }
      },
      {
        "name": "RIAZ",
        "meta": {
          "shortened": false,
          "fullName": "Wahab Riaz"
        }
      },
      {
        "name": "YASIR",
        "meta": {
          "shortened": false,
          "fullName": "Yasir Shah"
        }
      },
      {
        "name": "SHAH",
        "meta": {
          "shortened": false,
          "fullName": "Yasir Shah"
        }
      },
      {
        "name": "ZAFAR",
        "meta": {
          "shortened": false,
          "fullName": "Zafar Gohar"
        }
      },
      {
        "name": "GOHAR",
        "meta": {
          "shortened": false,
          "fullName": "Zafar Gohar"
        }
      },
      {
        "name": "KHURR",
        "meta": {
          "shortened": true,
          "fullName": "Khurram Shahzad"
        }
      },
      {
        "name": "SHAHZ",
        "meta": {
          "shortened": true,
          "fullName": "Khurram Shahzad"
        }
      },
      {
        "name": "MOHAM",
        "meta": {
          "shortened": true,
          "fullName": "Mohammad Haris"
        }
      },
      {
        "name": "HARIS",
        "meta": {
          "shortened": false,
          "fullName": "Mohammad Haris"
        }
      },
      {
        "name": "TAYYA",
        "meta": {
          "shortened": true,
          "fullName": "Tayyab Tahir"
        }
      },
      {
        "name": "TAHIR",
        "meta": {
          "shortened": false,
          "fullName": "Tayyab Tahir"
        }
      },
      {
        "name": "HABIB",
        "meta": {
          "shortened": true,
          "fullName": "Habibul Bashar"
        }
      },
      {
        "name": "BASHA",
        "meta": {
          "shortened": true,
          "fullName": "Habibul Bashar"
        }
      },
      {
        "name": "MOHAM",
        "meta": {
          "shortened": true,
          "fullName": "Mohammad Ashraful"
        }
      },
      {
        "name": "ASHRA",
        "meta": {
          "shortened": true,
          "fullName": "Mohammad Ashraful"
        }
      },
      {
        "name": "KHALE",
        "meta": {
          "shortened": true,
          "fullName": "Khaled Mashud"
        }
      },
      {
        "name": "MASHU",
        "meta": {
          "shortened": true,
          "fullName": "Khaled Mashud"
        }
      },
      {
        "name": "ABDUR",
        "meta": {
          "shortened": false,
          "fullName": "Abdur Razzak"
        }
      },
      {
        "name": "RAZZA",
        "meta": {
          "shortened": true,
          "fullName": "Abdur Razzak"
        }
      },
      {
        "name": "SHAHA",
        "meta": {
          "shortened": true,
          "fullName": "Shahadat Hossain"
        }
      },
      {
        "name": "HOSSA",
        "meta": {
          "shortened": true,
          "fullName": "Shahadat Hossain"
        }
      },
      {
        "name": "RUBEL",
        "meta": {
          "shortened": false,
          "fullName": "Rubel Hossain"
        }
      },
      {
        "name": "HOSSA",
        "meta": {
          "shortened": true,
          "fullName": "Rubel Hossain"
        }
      },
      {
        "name": "AL",
        "meta": {
          "shortened": false,
          "fullName": "Al Amin Hossain"
        }
      },
      {
        "name": "AMIN",
        "meta": {
          "shortened": false,
          "fullName": "Al Amin Hossain"
        }
      },
      {
        "name": "HOSSA",
        "meta": {
          "shortened": true,
          "fullName": "Al Amin Hossain"
        }
      },
      {
        "name": "PARVE",
        "meta": {
          "shortened": true,
          "fullName": "Parvez Hossain Emon"
        }
      },
      {
        "name": "HOSSA",
        "meta": {
          "shortened": true,
          "fullName": "Parvez Hossain Emon"
        }
      },
      {
        "name": "EMON",
        "meta": {
          "shortened": false,
          "fullName": "Parvez Hossain Emon"
        }
      },
      {
        "name": "SHAHA",
        "meta": {
          "shortened": true,
          "fullName": "Shahadat Hossain Dipu"
        }
      },
      {
        "name": "HOSSA",
        "meta": {
          "shortened": true,
          "fullName": "Shahadat Hossain Dipu"
        }
      },
      {
        "name": "DIPU",
        "meta": {
          "shortened": false,
          "fullName": "Shahadat Hossain Dipu"
        }
      },
      {
        "name": "SAMIU",
        "meta": {
          "shortened": true,
          "fullName": "Samiullah Shenwari"
        }
      },
      {
        "name": "SHENW",
        "meta": {
          "shortened": true,
          "fullName": "Samiullah Shenwari"
        }
      },
      {
        "name": "MOHAM",
        "meta": {
          "shortened": true,
          "fullName": "Mohammad Nabi"
        }
      },
      {
        "name": "NABI",
        "meta": {
          "shortened": false,
          "fullName": "Mohammad Nabi"
        }
      },
      {
        "name": "HAMID",
        "meta": {
          "shortened": false,
          "fullName": "Hamid Hassan"
        }
      },
      {
        "name": "HASSA",
        "meta": {
          "shortened": true,
          "fullName": "Hamid Hassan"
        }
      },
      {
        "name": "DAWLA",
        "meta": {
          "shortened": true,
          "fullName": "Dawlat Zadran"
        }
      },
      {
        "name": "ZADRA",
        "meta": {
          "shortened": true,
          "fullName": "Dawlat Zadran"
        }
      },
      {
        "name": "SHAPO",
        "meta": {
          "shortened": true,
          "fullName": "Shapoor Zadran"
        }
      },
      {
        "name": "ZADRA",
        "meta": {
          "shortened": true,
          "fullName": "Shapoor Zadran"
        }
      },
      {
        "name": "RAHMA",
        "meta": {
          "shortened": true,
          "fullName": "Rahmat Shah"
        }
      },
      {
        "name": "SHAH",
        "meta": {
          "shortened": false,
          "fullName": "Rahmat Shah"
        }
      },
      {
        "name": "HASHM",
        "meta": {
          "shortened": true,
          "fullName": "Hashmatullah Shahidi"
        }
      },
      {
        "name": "SHAHI",
        "meta": {
          "shortened": true,
          "fullName": "Hashmatullah Shahidi"
        }
      },
      {
        "name": "SEDIQ",
        "meta": {
          "shortened": true,
          "fullName": "Sediqullah Atal"
        }
      },
      {
        "name": "ATAL",
        "meta": {
          "shortened": false,
          "fullName": "Sediqullah Atal"
        }
      },
      {
        "name": "ABDUL",
        "meta": {
          "shortened": false,
          "fullName": "Abdul Rahman"
        }
      },
      {
        "name": "RAHMA",
        "meta": {
          "shortened": true,
          "fullName": "Abdul Rahman"
        }
      },
      {
        "name": "DAVE",
        "meta": {
          "shortened": false,
          "fullName": "Dave Houghton"
        }
      },
      {
        "name": "HOUGH",
        "meta": {
          "shortened": true,
          "fullName": "Dave Houghton"
        }
      },
      {
        "name": "MURRA",
        "meta": {
          "shortened": true,
          "fullName": "Murray Goodwin"
        }
      },
      {
        "name": "GOODW",
        "meta": {
          "shortened": true,
          "fullName": "Murray Goodwin"
        }
      },
      {
        "name": "ALIST",
        "meta": {
          "shortened": true,
          "fullName": "Alistair Campbell"
        }
      },
      {
        "name": "CAMPB",
        "meta": {
          "shortened": true,
          "fullName": "Alistair Campbell"
        }
      },
      {
        "name": "HENRY",
        "meta": {
          "shortened": false,
          "fullName": "Henry Olonga"
        }
      },
      {
        "name": "OLONG",
        "meta": {
          "shortened": true,
          "fullName": "Henry Olonga"
        }
      },
      {
        "name": "HEATH",
        "meta": {
          "shortened": false,
          "fullName": "Heath Streak"
        }
      },
      {
        "name": "STREA",
        "meta": {
          "shortened": true,
          "fullName": "Heath Streak"
        }
      },
      {
        "name": "GUY",
        "meta": {
          "shortened": false,
          "fullName": "Guy Whittall"
        }
      },
      {
        "name": "WHITT",
        "meta": {
          "shortened": true,
          "fullName": "Guy Whittall"
        }
      },
      {
        "name": "GRANT",
        "meta": {
          "shortened": false,
          "fullName": "Grant Flower"
        }
      },
      {
        "name": "FLOWE",
        "meta": {
          "shortened": true,
          "fullName": "Grant Flower"
        }
      },
      {
        "name": "TATEN",
        "meta": {
          "shortened": true,
          "fullName": "Tatenda Taibu"
        }
      },
      {
        "name": "TAIBU",
        "meta": {
          "shortened": false,
          "fullName": "Tatenda Taibu"
        }
      },
      {
        "name": "DOUGL",
        "meta": {
          "shortened": true,
          "fullName": "Douglas Marillier"
        }
      },
      {
        "name": "MARIL",
        "meta": {
          "shortened": true,
          "fullName": "Douglas Marillier"
        }
      },
      {
        "name": "ELTON",
        "meta": {
          "shortened": false,
          "fullName": "Elton Chigumbura"
        }
      },
      {
        "name": "CHIGU",
        "meta": {
          "shortened": true,
          "fullName": "Elton Chigumbura"
        }
      },
      {
        "name": "PROSP",
        "meta": {
          "shortened": true,
          "fullName": "Prosper Utseya"
        }
      },
      {
        "name": "UTSEY",
        "meta": {
          "shortened": true,
          "fullName": "Prosper Utseya"
        }
      },
      {
        "name": "BRIAN",
        "meta": {
          "shortened": false,
          "fullName": "Brian Vitori"
        }
      },
      {
        "name": "VITOR",
        "meta": {
          "shortened": true,
          "fullName": "Brian Vitori"
        }
      },
      {
        "name": "TINAS",
        "meta": {
          "shortened": true,
          "fullName": "Tinashe Kamunhukamwe"
        }
      },
      {
        "name": "KAMUN",
        "meta": {
          "shortened": true,
          "fullName": "Tinashe Kamunhukamwe"
        }
      },
      {
        "name": "WESSL",
        "meta": {
          "shortened": true,
          "fullName": "Wessly Madhevere"
        }
      },
      {
        "name": "MADHE",
        "meta": {
          "shortened": true,
          "fullName": "Wessly Madhevere"
        }
      },
      {
        "name": "MILTO",
        "meta": {
          "shortened": true,
          "fullName": "Milton Shumba"
        }
      },
      {
        "name": "SHUMB",
        "meta": {
          "shortened": true,
          "fullName": "Milton Shumba"
        }
      },
      {
        "name": "TAKUD",
        "meta": {
          "shortened": true,
          "fullName": "Takudzwanashe Kaitano"
        }
      },
      {
        "name": "KAITA",
        "meta": {
          "shortened": true,
          "fullName": "Takudzwanashe Kaitano"
        }
      },
      {
        "name": "TRENT",
        "meta": {
          "shortened": false,
          "fullName": "Trent Johnston"
        }
      },
      {
        "name": "JOHNS",
        "meta": {
          "shortened": true,
          "fullName": "Trent Johnston"
        }
      },
      {
        "name": "KEVIN",
        "meta": {
          "shortened": false,
          "fullName": "Kevin O Brien"
        }
      },
      {
        "name": "O",
        "meta": {
          "shortened": false,
          "fullName": "Kevin O Brien"
        }
      },
      {
        "name": "BRIEN",
        "meta": {
          "shortened": false,
          "fullName": "Kevin O Brien"
        }
      },
      {
        "name": "NIALL",
        "meta": {
          "shortened": false,
          "fullName": "Niall O Brien"
        }
      },
      {
        "name": "O",
        "meta": {
          "shortened": false,
          "fullName": "Niall O Brien"
        }
      },
      {
        "name": "BRIEN",
        "meta": {
          "shortened": false,
          "fullName": "Niall O Brien"
        }
      },
      {
        "name": "BOYD",
        "meta": {
          "shortened": false,
          "fullName": "Boyd Rankin"
        }
      },
      {
        "name": "RANKI",
        "meta": {
          "shortened": true,
          "fullName": "Boyd Rankin"
        }
      },
      {
        "name": "JOHN",
        "meta": {
          "shortened": false,
          "fullName": "John Mooney"
        }
      },
      {
        "name": "MOONE",
        "meta": {
          "shortened": true,
          "fullName": "John Mooney"
        }
      },
      {
        "name": "PETER",
        "meta": {
          "shortened": false,
          "fullName": "Peter Stirling"
        }
      },
      {
        "name": "STIRL",
        "meta": {
          "shortened": true,
          "fullName": "Peter Stirling"
        }
      },
      {
        "name": "HARRY",
        "meta": {
          "shortened": false,
          "fullName": "Harry Tector"
        }
      },
      {
        "name": "TECTO",
        "meta": {
          "shortened": true,
          "fullName": "Harry Tector"
        }
      },
      {
        "name": "LORCA",
        "meta": {
          "shortened": true,
          "fullName": "Lorcan Tucker"
        }
      },
      {
        "name": "TUCKE",
        "meta": {
          "shortened": true,
          "fullName": "Lorcan Tucker"
        }
      },
      {
        "name": "NEIL",
        "meta": {
          "shortened": false,
          "fullName": "Neil Rock"
        }
      },
      {
        "name": "ROCK",
        "meta": {
          "shortened": false,
          "fullName": "Neil Rock"
        }
      },
      {
        "name": "MATTH",
        "meta": {
          "shortened": true,
          "fullName": "Matthew Humphreys"
        }
      },
      {
        "name": "HUMPH",
        "meta": {
          "shortened": true,
          "fullName": "Matthew Humphreys"
        }
      },
      {
        "name": "DAAN",
        "meta": {
          "shortened": false,
          "fullName": "Daan van Bunge"
        }
      },
      {
        "name": "VAN",
        "meta": {
          "shortened": false,
          "fullName": "Daan van Bunge"
        }
      },
      {
        "name": "BUNGE",
        "meta": {
          "shortened": false,
          "fullName": "Daan van Bunge"
        }
      },
      {
        "name": "DIRK",
        "meta": {
          "shortened": false,
          "fullName": "Dirk Nannes"
        }
      },
      {
        "name": "NANNE",
        "meta": {
          "shortened": true,
          "fullName": "Dirk Nannes"
        }
      },
      {
        "name": "PIETE",
        "meta": {
          "shortened": true,
          "fullName": "Pieter Seelaar"
        }
      },
      {
        "name": "SEELA",
        "meta": {
          "shortened": true,
          "fullName": "Pieter Seelaar"
        }
      },
      {
        "name": "MAX",
        "meta": {
          "shortened": false,
          "fullName": "Max ODowd"
        }
      },
      {
        "name": "ODOWD",
        "meta": {
          "shortened": false,
          "fullName": "Max ODowd"
        }
      },
      {
        "name": "STEPH",
        "meta": {
          "shortened": true,
          "fullName": "Stephan Myburgh"
        }
      },
      {
        "name": "MYBUR",
        "meta": {
          "shortened": true,
          "fullName": "Stephan Myburgh"
        }
      },
      {
        "name": "TOBIA",
        "meta": {
          "shortened": true,
          "fullName": "Tobias Visee"
        }
      },
      {
        "name": "VISEE",
        "meta": {
          "shortened": false,
          "fullName": "Tobias Visee"
        }
      },
      {
        "name": "SYBRA",
        "meta": {
          "shortened": true,
          "fullName": "Sybrand Engelbrecht"
        }
      },
      {
        "name": "ENGEL",
        "meta": {
          "shortened": true,
          "fullName": "Sybrand Engelbrecht"
        }
      },
      {
        "name": "KYLE",
        "meta": {
          "shortened": false,
          "fullName": "Kyle Coetzer"
        }
      },
      {
        "name": "COETZ",
        "meta": {
          "shortened": true,
          "fullName": "Kyle Coetzer"
        }
      },
      {
        "name": "RICHI",
        "meta": {
          "shortened": true,
          "fullName": "Richie Berrington"
        }
      },
      {
        "name": "BERRI",
        "meta": {
          "shortened": true,
          "fullName": "Richie Berrington"
        }
      },
      {
        "name": "MATTH",
        "meta": {
          "shortened": true,
          "fullName": "Matthew Cross"
        }
      },
      {
        "name": "CROSS",
        "meta": {
          "shortened": false,
          "fullName": "Matthew Cross"
        }
      },
      {
        "name": "MICHA",
        "meta": {
          "shortened": true,
          "fullName": "Michael Leask"
        }
      },
      {
        "name": "LEASK",
        "meta": {
          "shortened": false,
          "fullName": "Michael Leask"
        }
      },
      {
        "name": "SAFYA",
        "meta": {
          "shortened": true,
          "fullName": "Safyaan Sharif"
        }
      },
      {
        "name": "SHARI",
        "meta": {
          "shortened": true,
          "fullName": "Safyaan Sharif"
        }
      },
      {
        "name": "MARK",
        "meta": {
          "shortened": false,
          "fullName": "Mark Watt"
        }
      },
      {
        "name": "WATT",
        "meta": {
          "shortened": false,
          "fullName": "Mark Watt"
        }
      },
      {
        "name": "CHRIS",
        "meta": {
          "shortened": false,
          "fullName": "Chris Greaves"
        }
      },
      {
        "name": "GREAV",
        "meta": {
          "shortened": true,
          "fullName": "Chris Greaves"
        }
      },
      {
        "name": "GERHA",
        "meta": {
          "shortened": true,
          "fullName": "Gerhard Erasmus"
        }
      },
      {
        "name": "ERASM",
        "meta": {
          "shortened": true,
          "fullName": "Gerhard Erasmus"
        }
      },
      {
        "name": "ZANE",
        "meta": {
          "shortened": false,
          "fullName": "Zane Green"
        }
      },
      {
        "name": "GREEN",
        "meta": {
          "shortened": false,
          "fullName": "Zane Green"
        }
      },
      {
        "name": "DAVID",
        "meta": {
          "shortened": false,
          "fullName": "David Wiese"
        }
      },
      {
        "name": "WIESE",
        "meta": {
          "shortened": false,
          "fullName": "David Wiese"
        }
      },
      {
        "name": "JAN",
        "meta": {
          "shortened": false,
          "fullName": "Jan Frylinck"
        }
      },
      {
        "name": "FRYLI",
        "meta": {
          "shortened": true,
          "fullName": "Jan Frylinck"
        }
      },
      {
        "name": "BEN",
        "meta": {
          "shortened": false,
          "fullName": "Ben Shikongo"
        }
      },
      {
        "name": "SHIKO",
        "meta": {
          "shortened": true,
          "fullName": "Ben Shikongo"
        }
      },
      {
        "name": "SHREY",
        "meta": {
          "shortened": true,
          "fullName": "Shreyas Movva"
        }
      },
      {
        "name": "MOVVA",
        "meta": {
          "shortened": false,
          "fullName": "Shreyas Movva"
        }
      },
      {
        "name": "NAVNE",
        "meta": {
          "shortened": true,
          "fullName": "Navneet Dhaliwal"
        }
      },
      {
        "name": "DHALI",
        "meta": {
          "shortened": true,
          "fullName": "Navneet Dhaliwal"
        }
      },
      {
        "name": "SAAD",
        "meta": {
          "shortened": false,
          "fullName": "Saad Bin Zafar"
        }
      },
      {
        "name": "BIN",
        "meta": {
          "shortened": false,
          "fullName": "Saad Bin Zafar"
        }
      },
      {
        "name": "ZAFAR",
        "meta": {
          "shortened": false,
          "fullName": "Saad Bin Zafar"
        }
      },
      {
        "name": "PARGA",
        "meta": {
          "shortened": true,
          "fullName": "Pargat Singh"
        }
      },
      {
        "name": "SINGH",
        "meta": {
          "shortened": false,
          "fullName": "Pargat Singh"
        }
      },
      {
        "name": "MUHAM",
        "meta": {
          "shortened": true,
          "fullName": "Muhammad Usman"
        }
      },
      {
        "name": "USMAN",
        "meta": {
          "shortened": false,
          "fullName": "Muhammad Usman"
        }
      },
      {
        "name": "VRIIT",
        "meta": {
          "shortened": true,
          "fullName": "Vriitya Aravind"
        }
      },
      {
        "name": "ARAVI",
        "meta": {
          "shortened": true,
          "fullName": "Vriitya Aravind"
        }
      },
      {
        "name": "CHIRA",
        "meta": {
          "shortened": true,
          "fullName": "Chirag Suri"
        }
      },
      {
        "name": "SURI",
        "meta": {
          "shortened": false,
          "fullName": "Chirag Suri"
        }
      },
      {
        "name": "ARYAN",
        "meta": {
          "shortened": false,
          "fullName": "Aryan Lakra"
        }
      },
      {
        "name": "LAKRA",
        "meta": {
          "shortened": false,
          "fullName": "Aryan Lakra"
        }
      },
      {
        "name": "SANDE",
        "meta": {
          "shortened": true,
          "fullName": "Sandeep Lamichhane"
        }
      },
      {
        "name": "LAMIC",
        "meta": {
          "shortened": true,
          "fullName": "Sandeep Lamichhane"
        }
      },
      {
        "name": "KUSHA",
        "meta": {
          "shortened": true,
          "fullName": "Kushal Bhurtel"
        }
      },
      {
        "name": "BHURT",
        "meta": {
          "shortened": true,
          "fullName": "Kushal Bhurtel"
        }
      },
      {
        "name": "DIPEN",
        "meta": {
          "shortened": true,
          "fullName": "Dipendra Singh Airee"
        }
      },
      {
        "name": "SINGH",
        "meta": {
          "shortened": false,
          "fullName": "Dipendra Singh Airee"
        }
      },
      {
        "name": "AIREE",
        "meta": {
          "shortened": false,
          "fullName": "Dipendra Singh Airee"
        }
      },
      {
        "name": "ROHIT",
        "meta": {
          "shortened": false,
          "fullName": "Rohit Paudel"
        }
      },
      {
        "name": "PAUDE",
        "meta": {
          "shortened": true,
          "fullName": "Rohit Paudel"
        }
      },
      {
        "name": "AASIF",
        "meta": {
          "shortened": false,
          "fullName": "Aasif Sheikh"
        }
      },
      {
        "name": "SHEIK",
        "meta": {
          "shortened": true,
          "fullName": "Aasif Sheikh"
        }
      },
      {
        "name": "ZEESH",
        "meta": {
          "shortened": true,
          "fullName": "Zeeshan Maqsood"
        }
      },
      {
        "name": "MAQSO",
        "meta": {
          "shortened": true,
          "fullName": "Zeeshan Maqsood"
        }
      },
      {
        "name": "NASEE",
        "meta": {
          "shortened": true,
          "fullName": "Naseem Khushi"
        }
      },
      {
        "name": "KHUSH",
        "meta": {
          "shortened": true,
          "fullName": "Naseem Khushi"
        }
      },
      {
        "name": "BILAL",
        "meta": {
          "shortened": false,
          "fullName": "Bilal Khan"
        }
      },
      {
        "name": "KHAN",
        "meta": {
          "shortened": false,
          "fullName": "Bilal Khan"
        }
      },
      {
        "name": "SHOAI",
        "meta": {
          "shortened": true,
          "fullName": "Shoaib Khan"
        }
      },
      {
        "name": "KHAN",
        "meta": {
          "shortened": false,
          "fullName": "Shoaib Khan"
        }
      },
      {
        "name": "STEVE",
        "meta": {
          "shortened": false,
          "fullName": "Steve Tikolo"
        }
      },
      {
        "name": "TIKOL",
        "meta": {
          "shortened": true,
          "fullName": "Steve Tikolo"
        }
      },
      {
        "name": "THOMA",
        "meta": {
          "shortened": true,
          "fullName": "Thomas Odoyo"
        }
      },
      {
        "name": "ODOYO",
        "meta": {
          "shortened": false,
          "fullName": "Thomas Odoyo"
        }
      },
      {
        "name": "MAURI",
        "meta": {
          "shortened": true,
          "fullName": "Maurice Odumbe"
        }
      },
      {
        "name": "ODUMB",
        "meta": {
          "shortened": true,
          "fullName": "Maurice Odumbe"
        }
      },
      {
        "name": "COLLI",
        "meta": {
          "shortened": true,
          "fullName": "Collins Obuya"
        }
      },
      {
        "name": "OBUYA",
        "meta": {
          "shortened": false,
          "fullName": "Collins Obuya"
        }
      },
      {
        "name": "DAVID",
        "meta": {
          "shortened": false,
          "fullName": "David Obuya"
        }
      },
      {
        "name": "OBUYA",
        "meta": {
          "shortened": false,
          "fullName": "David Obuya"
        }
      },
      {
        "name": "ASSAD",
        "meta": {
          "shortened": false,
          "fullName": "Assad Vala"
        }
      },
      {
        "name": "VALA",
        "meta": {
          "shortened": false,
          "fullName": "Assad Vala"
        }
      },
      {
        "name": "NORMA",
        "meta": {
          "shortened": true,
          "fullName": "Norman Vanua"
        }
      },
      {
        "name": "VANUA",
        "meta": {
          "shortened": false,
          "fullName": "Norman Vanua"
        }
      },
      {
        "name": "KIPLI",
        "meta": {
          "shortened": true,
          "fullName": "Kiplin Doriga"
        }
      },
      {
        "name": "DORIG",
        "meta": {
          "shortened": true,
          "fullName": "Kiplin Doriga"
        }
      },
      {
        "name": "CHARL",
        "meta": {
          "shortened": true,
          "fullName": "Charles Amini"
        }
      },
      {
        "name": "AMINI",
        "meta": {
          "shortened": false,
          "fullName": "Charles Amini"
        }
      },
      {
        "name": "BABAR",
        "meta": {
          "shortened": false,
          "fullName": "Babar Hayat"
        }
      },
      {
        "name": "HAYAT",
        "meta": {
          "shortened": false,
          "fullName": "Babar Hayat"
        }
      },
      {
        "name": "KINCH",
        "meta": {
          "shortened": true,
          "fullName": "Kinchit Shah"
        }
      },
      {
        "name": "SHAH",
        "meta": {
          "shortened": false,
          "fullName": "Kinchit Shah"
        }
      },
      {
        "name": "YASIM",
        "meta": {
          "shortened": false,
          "fullName": "Yasim Murtaza"
        }
      },
      {
        "name": "MURTA",
        "meta": {
          "shortened": true,
          "fullName": "Yasim Murtaza"
        }
      },
      {
        "name": "TANVI",
        "meta": {
          "shortened": true,
          "fullName": "Tanvir Afzal"
        }
      },
      {
        "name": "AFZAL",
        "meta": {
          "shortened": false,
          "fullName": "Tanvir Afzal"
        }
      },
        {
          "name": "YUSUF",
          "meta": {
            "shortened": false,
            "fullName": "Yusuf Pathan"
          }
        },
        {
          "name": "PATHA",
          "meta": {
            "shortened": true,
            "fullName": "Yusuf Pathan"
          }
        },
        {
          "name": "MOHAM",
          "meta": {
            "shortened": true,
            "fullName": "Mohammad Kaif"
          }
        },
        {
          "name": "KAIF",
          "meta": {
            "shortened": false,
            "fullName": "Mohammad Kaif"
          }
        },
        {
          "name": "AJIT",
          "meta": {
            "shortened": false,
            "fullName": "Ajit Agarkar"
          }
        },
        {
          "name": "AGARK",
          "meta": {
            "shortened": true,
            "fullName": "Ajit Agarkar"
          }
        },
        {
          "name": "SANJA",
          "meta": {
            "shortened": true,
            "fullName": "Sanjay Bangar"
          }
        },
        {
          "name": "BANGA",
          "meta": {
            "shortened": true,
            "fullName": "Sanjay Bangar"
          }
        },
        {
          "name": "VIKAS",
          "meta": {
            "shortened": false,
            "fullName": "Vikas Sehrawat"
          }
        },
        {
          "name": "SEHRA",
          "meta": {
            "shortened": true,
            "fullName": "Vikas Sehrawat"
          }
        },
        {
          "name": "SAIRA",
          "meta": {
            "shortened": true,
            "fullName": "Sairaj Bahutule"
          }
        },
        {
          "name": "BAHUT",
          "meta": {
            "shortened": true,
            "fullName": "Sairaj Bahutule"
          }
        },
        {
          "name": "SURES",
          "meta": {
            "shortened": true,
            "fullName": "Suresh Kumar"
          }
        },
        {
          "name": "KUMAR",
          "meta": {
            "shortened": false,
            "fullName": "Suresh Kumar"
          }
        },
        {
          "name": "VB",
          "meta": {
            "shortened": false,
            "fullName": "VB Chandrasekhar"
          }
        },
        {
          "name": "CHAND",
          "meta": {
            "shortened": true,
            "fullName": "VB Chandrasekhar"
          }
        },
        {
          "name": "NOEL",
          "meta": {
            "shortened": false,
            "fullName": "Noel David"
          }
        },
        {
          "name": "DAVID",
          "meta": {
            "shortened": false,
            "fullName": "Noel David"
          }
        },
        {
          "name": "ABEY",
          "meta": {
            "shortened": false,
            "fullName": "Abey Kuruvilla"
          }
        },
        {
          "name": "KURUV",
          "meta": {
            "shortened": true,
            "fullName": "Abey Kuruvilla"
          }
        },
        {
          "name": "DAVID",
          "meta": {
            "shortened": false,
            "fullName": "David Johnson"
          }
        },
        {
          "name": "JOHNS",
          "meta": {
            "shortened": true,
            "fullName": "David Johnson"
          }
        },
        {
          "name": "DODDA",
          "meta": {
            "shortened": false,
            "fullName": "Dodda Ganesh"
          }
        },
        {
          "name": "GANES",
          "meta": {
            "shortened": true,
            "fullName": "Dodda Ganesh"
          }
        },
        {
          "name": "SOURA",
          "meta": {
            "shortened": true,
            "fullName": "Sourav Sarkar"
          }
        },
        {
          "name": "SARKA",
          "meta": {
            "shortened": true,
            "fullName": "Sourav Sarkar"
          }
        },
        {
          "name": "ROHAN",
          "meta": {
            "shortened": false,
            "fullName": "Rohan Gavaskar"
          }
        },
        {
          "name": "GAVAS",
          "meta": {
            "shortened": true,
            "fullName": "Rohan Gavaskar"
          }
        },
        {
          "name": "SHIV",
          "meta": {
            "shortened": false,
            "fullName": "Shiv Sunder Das"
          }
        },
        {
          "name": "SUNDE",
          "meta": {
            "shortened": true,
            "fullName": "Shiv Sunder Das"
          }
        },
        {
          "name": "DAS",
          "meta": {
            "shortened": false,
            "fullName": "Shiv Sunder Das"
          }
        },
        {
          "name": "SRIDH",
          "meta": {
            "shortened": true,
            "fullName": "Sridharan Sharath"
          }
        },
        {
          "name": "SHARA",
          "meta": {
            "shortened": true,
            "fullName": "Sridharan Sharath"
          }
        },
        {
          "name": "PANKA",
          "meta": {
            "shortened": true,
            "fullName": "Pankaj Singh"
          }
        },
        {
          "name": "SINGH",
          "meta": {
            "shortened": false,
            "fullName": "Pankaj Singh"
          }
        },
        {
          "name": "STUAR",
          "meta": {
            "shortened": true,
            "fullName": "Stuart Binny"
          }
        },
        {
          "name": "BINNY",
          "meta": {
            "shortened": false,
            "fullName": "Stuart Binny"
          }
        },
        {
          "name": "CHETE",
          "meta": {
            "shortened": true,
            "fullName": "Cheteshwar Pujara"
          }
        },
        {
          "name": "PUJAR",
          "meta": {
            "shortened": true,
            "fullName": "Cheteshwar Pujara"
          }
        },
        {
          "name": "SUDEE",
          "meta": {
            "shortened": true,
            "fullName": "Sudeep Tyagi"
          }
        },
        {
          "name": "TYAGI",
          "meta": {
            "shortened": false,
            "fullName": "Sudeep Tyagi"
          }
        },
        {
          "name": "AMIT",
          "meta": {
            "shortened": false,
            "fullName": "Amit Mishra"
          }
        },
        {
          "name": "MISHR",
          "meta": {
            "shortened": true,
            "fullName": "Amit Mishra"
          }
        },
        {
          "name": "ISHAN",
          "meta": {
            "shortened": true,
            "fullName": "Ishant Sharma"
          }
        },
        {
          "name": "SHARM",
          "meta": {
            "shortened": true,
            "fullName": "Ishant Sharma"
          }
        },
        {
          "name": "MOHIT",
          "meta": {
            "shortened": false,
            "fullName": "Mohit Sharma"
          }
        },
        {
          "name": "SHARM",
          "meta": {
            "shortened": true,
            "fullName": "Mohit Sharma"
          }
        },
        {
          "name": "DHAWA",
          "meta": {
            "shortened": true,
            "fullName": "Dhawal Kulkarni"
          }
        },
        {
          "name": "KULKA",
          "meta": {
            "shortened": true,
            "fullName": "Dhawal Kulkarni"
          }
        },
        {
          "name": "BARIN",
          "meta": {
            "shortened": true,
            "fullName": "Barinder Sran"
          }
        },
        {
          "name": "SRAN",
          "meta": {
            "shortened": false,
            "fullName": "Barinder Sran"
          }
        },
        {
          "name": "JAYDE",
          "meta": {
            "shortened": true,
            "fullName": "Jaydev Unadkat"
          }
        },
        {
          "name": "UNADK",
          "meta": {
            "shortened": true,
            "fullName": "Jaydev Unadkat"
          }
        },
        {
          "name": "KARUN",
          "meta": {
            "shortened": false,
            "fullName": "Karun Nair"
          }
        },
        {
          "name": "NAIR",
          "meta": {
            "shortened": false,
            "fullName": "Karun Nair"
          }
        },
        {
          "name": "LOKES",
          "meta": {
            "shortened": true,
            "fullName": "Lokesh Rahul"
          }
        },
        {
          "name": "RAHUL",
          "meta": {
            "shortened": false,
            "fullName": "Lokesh Rahul"
          }
        },
        {
          "name": "SANJU",
          "meta": {
            "shortened": false,
            "fullName": "Sanju Samson"
          }
        },
        {
          "name": "SAMSO",
          "meta": {
            "shortened": true,
            "fullName": "Sanju Samson"
          }
        },
        {
          "name": "SHREY",
          "meta": {
            "shortened": true,
            "fullName": "Shreyas Iyer"
          }
        },
        {
          "name": "IYER",
          "meta": {
            "shortened": false,
            "fullName": "Shreyas Iyer"
          }
        },
        {
          "name": "RAHUL",
          "meta": {
            "shortened": false,
            "fullName": "Rahul Tewatia"
          }
        },
        {
          "name": "TEWAT",
          "meta": {
            "shortened": true,
            "fullName": "Rahul Tewatia"
          }
        },
        {
          "name": "ANRIC",
          "meta": {
            "shortened": true,
            "fullName": "Anrich Nortje"
          }
        },
        {
          "name": "NORTJ",
          "meta": {
            "shortened": true,
            "fullName": "Anrich Nortje"
          }
        },
        {
          "name": "KRUNA",
          "meta": {
            "shortened": true,
            "fullName": "Krunal Pandya"
          }
        },
        {
          "name": "PANDY",
          "meta": {
            "shortened": true,
            "fullName": "Krunal Pandya"
          }
        },
        {
          "name": "SHAHB",
          "meta": {
            "shortened": true,
            "fullName": "Shahbaz Nadeem"
          }
        },
        {
          "name": "NADEE",
          "meta": {
            "shortened": true,
            "fullName": "Shahbaz Nadeem"
          }
        },
        {
          "name": "KULWA",
          "meta": {
            "shortened": true,
            "fullName": "Kulwant Khejroliya"
          }
        },
        {
          "name": "KHEJR",
          "meta": {
            "shortened": true,
            "fullName": "Kulwant Khejroliya"
          }
        },
        {
          "name": "JOS",
          "meta": {
            "shortened": false,
            "fullName": "Jos Buttler"
          }
        },
        {
          "name": "BUTTL",
          "meta": {
            "shortened": true,
            "fullName": "Jos Buttler"
          }
        },
        {
          "name": "EOIN",
          "meta": {
            "shortened": false,
            "fullName": "Eoin Morgan"
          }
        },
        {
          "name": "MORGA",
          "meta": {
            "shortened": true,
            "fullName": "Eoin Morgan"
          }
        },
        {
          "name": "ANDRE",
          "meta": {
            "shortened": true,
            "fullName": "Andrew Strauss"
          }
        },
        {
          "name": "STRAU",
          "meta": {
            "shortened": true,
            "fullName": "Andrew Strauss"
          }
        },
        {
          "name": "NICK",
          "meta": {
            "shortened": false,
            "fullName": "Nick Compton"
          }
        },
        {
          "name": "COMPT",
          "meta": {
            "shortened": true,
            "fullName": "Nick Compton"
          }
        },
        {
          "name": "JOE",
          "meta": {
            "shortened": false,
            "fullName": "Joe Denly"
          }
        },
        {
          "name": "DENLY",
          "meta": {
            "shortened": false,
            "fullName": "Joe Denly"
          }
        },
        {
          "name": "RORY",
          "meta": {
            "shortened": false,
            "fullName": "Rory Burns"
          }
        },
        {
          "name": "BURNS",
          "meta": {
            "shortened": false,
            "fullName": "Rory Burns"
          }
        },
        {
          "name": "JASON",
          "meta": {
            "shortened": false,
            "fullName": "Jason Roy"
          }
        },
        {
          "name": "ROY",
          "meta": {
            "shortened": false,
            "fullName": "Jason Roy"
          }
        },
        {
          "name": "ALEX",
          "meta": {
            "shortened": false,
            "fullName": "Alex Hales"
          }
        },
        {
          "name": "HALES",
          "meta": {
            "shortened": false,
            "fullName": "Alex Hales"
          }
        },
        {
          "name": "LIAM",
          "meta": {
            "shortened": false,
            "fullName": "Liam Plunkett"
          }
        },
        {
          "name": "PLUNK",
          "meta": {
            "shortened": true,
            "fullName": "Liam Plunkett"
          }
        },
        {
          "name": "ADIL",
          "meta": {
            "shortened": false,
            "fullName": "Adil Rashid"
          }
        },
        {
          "name": "RASHI",
          "meta": {
            "shortened": true,
            "fullName": "Adil Rashid"
          }
        },
        {
          "name": "TOM",
          "meta": {
            "shortened": false,
            "fullName": "Tom Banton"
          }
        },
        {
          "name": "BANTO",
          "meta": {
            "shortened": true,
            "fullName": "Tom Banton"
          }
        },
        {
          "name": "PHIL",
          "meta": {
            "shortened": false,
            "fullName": "Phil Salt"
          }
        },
        {
          "name": "SALT",
          "meta": {
            "shortened": false,
            "fullName": "Phil Salt"
          }
        },
        {
          "name": "WILL",
          "meta": {
            "shortened": false,
            "fullName": "Will Jacks"
          }
        },
        {
          "name": "JACKS",
          "meta": {
            "shortened": false,
            "fullName": "Will Jacks"
          }
        },
        {
          "name": "LIAM",
          "meta": {
            "shortened": false,
            "fullName": "Liam Livingstone"
          }
        },
        {
          "name": "LIVIN",
          "meta": {
            "shortened": true,
            "fullName": "Liam Livingstone"
          }
        },
        {
          "name": "SAM",
          "meta": {
            "shortened": false,
            "fullName": "Sam Billings"
          }
        },
        {
          "name": "BILLI",
          "meta": {
            "shortened": true,
            "fullName": "Sam Billings"
          }
        },
        {
          "name": "DAVID",
          "meta": {
            "shortened": false,
            "fullName": "David Willey"
          }
        },
        {
          "name": "WILLE",
          "meta": {
            "shortened": true,
            "fullName": "David Willey"
          }
        },
        {
          "name": "CHRIS",
          "meta": {
            "shortened": false,
            "fullName": "Chris Jordan"
          }
        },
        {
          "name": "JORDA",
          "meta": {
            "shortened": true,
            "fullName": "Chris Jordan"
          }
        },
        {
          "name": "TYMAL",
          "meta": {
            "shortened": false,
            "fullName": "Tymal Mills"
          }
        },
        {
          "name": "MILLS",
          "meta": {
            "shortened": false,
            "fullName": "Tymal Mills"
          }
        },
        {
          "name": "MATTH",
          "meta": {
            "shortened": true,
            "fullName": "Matthew Potts"
          }
        },
        {
          "name": "POTTS",
          "meta": {
            "shortened": false,
            "fullName": "Matthew Potts"
          }
        },
        {
          "name": "BEN",
          "meta": {
            "shortened": false,
            "fullName": "Ben Foakes"
          }
        },
        {
          "name": "FOAKE",
          "meta": {
            "shortened": true,
            "fullName": "Ben Foakes"
          }
        },
        {
          "name": "GLENN",
          "meta": {
            "shortened": false,
            "fullName": "Glenn Maxwell"
          }
        },
        {
          "name": "MAXWE",
          "meta": {
            "shortened": true,
            "fullName": "Glenn Maxwell"
          }
        },
        {
          "name": "MITCH",
          "meta": {
            "shortened": false,
            "fullName": "Mitch Marsh"
          }
        },
        {
          "name": "MARSH",
          "meta": {
            "shortened": false,
            "fullName": "Mitch Marsh"
          }
        },
        {
          "name": "TIM",
          "meta": {
            "shortened": false,
            "fullName": "Tim David"
          }
        },
        {
          "name": "DAVID",
          "meta": {
            "shortened": false,
            "fullName": "Tim David"
          }
        },
        {
          "name": "MATTH",
          "meta": {
            "shortened": true,
            "fullName": "Matthew Wade"
          }
        },
        {
          "name": "WADE",
          "meta": {
            "shortened": false,
            "fullName": "Matthew Wade"
          }
        },
        {
          "name": "AARON",
          "meta": {
            "shortened": false,
            "fullName": "Aaron Finch"
          }
        },
        {
          "name": "FINCH",
          "meta": {
            "shortened": false,
            "fullName": "Aaron Finch"
          }
        },
        {
          "name": "SHAUN",
          "meta": {
            "shortened": false,
            "fullName": "Shaun Marsh"
          }
        },
        {
          "name": "MARSH",
          "meta": {
            "shortened": false,
            "fullName": "Shaun Marsh"
          }
        },
        {
          "name": "GEORG",
          "meta": {
            "shortened": true,
            "fullName": "George Bailey"
          }
        },
        {
          "name": "BAILE",
          "meta": {
            "shortened": true,
            "fullName": "George Bailey"
          }
        },
        {
          "name": "SHANE",
          "meta": {
            "shortened": false,
            "fullName": "Shane Watson"
          }
        },
        {
          "name": "WATSO",
          "meta": {
            "shortened": true,
            "fullName": "Shane Watson"
          }
        },
        {
          "name": "BRAD",
          "meta": {
            "shortened": false,
            "fullName": "Brad Hodge"
          }
        },
        {
          "name": "HODGE",
          "meta": {
            "shortened": false,
            "fullName": "Brad Hodge"
          }
        },
        {
          "name": "CHRIS",
          "meta": {
            "shortened": false,
            "fullName": "Chris Lynn"
          }
        },
        {
          "name": "LYNN",
          "meta": {
            "shortened": false,
            "fullName": "Chris Lynn"
          }
        },
        {
          "name": "D",
          "meta": {
            "shortened": false,
            "fullName": "D Arcy Short"
          }
        },
        {
          "name": "ARCY",
          "meta": {
            "shortened": false,
            "fullName": "D Arcy Short"
          }
        },
        {
          "name": "SHORT",
          "meta": {
            "shortened": false,
            "fullName": "D Arcy Short"
          }
        },
        {
          "name": "BEN",
          "meta": {
            "shortened": false,
            "fullName": "Ben McDermott"
          }
        },
        {
          "name": "MCDER",
          "meta": {
            "shortened": true,
            "fullName": "Ben McDermott"
          }
        },
        {
          "name": "PETER",
          "meta": {
            "shortened": false,
            "fullName": "Peter Handscomb"
          }
        },
        {
          "name": "HANDS",
          "meta": {
            "shortened": true,
            "fullName": "Peter Handscomb"
          }
        },
        {
          "name": "HILTO",
          "meta": {
            "shortened": true,
            "fullName": "Hilton Cartwright"
          }
        },
        {
          "name": "CARTW",
          "meta": {
            "shortened": true,
            "fullName": "Hilton Cartwright"
          }
        },
        {
          "name": "NATHA",
          "meta": {
            "shortened": true,
            "fullName": "Nathan Coulter Nile"
          }
        },
        {
          "name": "COULT",
          "meta": {
            "shortened": true,
            "fullName": "Nathan Coulter Nile"
          }
        },
        {
          "name": "NILE",
          "meta": {
            "shortened": false,
            "fullName": "Nathan Coulter Nile"
          }
        },
        {
          "name": "JAMES",
          "meta": {
            "shortened": false,
            "fullName": "James Faulkner"
          }
        },
        {
          "name": "FAULK",
          "meta": {
            "shortened": true,
            "fullName": "James Faulkner"
          }
        },
        {
          "name": "MITCH",
          "meta": {
            "shortened": true,
            "fullName": "Mitchell Johnson"
          }
        },
        {
          "name": "JOHNS",
          "meta": {
            "shortened": true,
            "fullName": "Mitchell Johnson"
          }
        },
        {
          "name": "PETER",
          "meta": {
            "shortened": false,
            "fullName": "Peter Siddle"
          }
        },
        {
          "name": "SIDDL",
          "meta": {
            "shortened": true,
            "fullName": "Peter Siddle"
          }
        },
        {
          "name": "RYAN",
          "meta": {
            "shortened": false,
            "fullName": "Ryan Harris"
          }
        },
        {
          "name": "HARRI",
          "meta": {
            "shortened": true,
            "fullName": "Ryan Harris"
          }
        },
        {
          "name": "CLINT",
          "meta": {
            "shortened": false,
            "fullName": "Clint McKay"
          }
        },
        {
          "name": "MCKAY",
          "meta": {
            "shortened": false,
            "fullName": "Clint McKay"
          }
        },
        {
          "name": "JOHN",
          "meta": {
            "shortened": false,
            "fullName": "John Hastings"
          }
        },
        {
          "name": "HASTI",
          "meta": {
            "shortened": true,
            "fullName": "John Hastings"
          }
        },
        {
          "name": "DANIE",
          "meta": {
            "shortened": true,
            "fullName": "Daniel Christian"
          }
        },
        {
          "name": "CHRIS",
          "meta": {
            "shortened": true,
            "fullName": "Daniel Christian"
          }
        },
        {
          "name": "LENDL",
          "meta": {
            "shortened": false,
            "fullName": "Lendl Simmons"
          }
        },
        {
          "name": "SIMMO",
          "meta": {
            "shortened": true,
            "fullName": "Lendl Simmons"
          }
        },
        {
          "name": "JOHNS",
          "meta": {
            "shortened": true,
            "fullName": "Johnson Charles"
          }
        },
        {
          "name": "CHARL",
          "meta": {
            "shortened": true,
            "fullName": "Johnson Charles"
          }
        },
        {
          "name": "DENES",
          "meta": {
            "shortened": true,
            "fullName": "Denesh Ramdin"
          }
        },
        {
          "name": "RAMDI",
          "meta": {
            "shortened": true,
            "fullName": "Denesh Ramdin"
          }
        },
        {
          "name": "CARLT",
          "meta": {
            "shortened": true,
            "fullName": "Carlton Baugh"
          }
        },
        {
          "name": "BAUGH",
          "meta": {
            "shortened": false,
            "fullName": "Carlton Baugh"
          }
        },
        {
          "name": "RAVI",
          "meta": {
            "shortened": false,
            "fullName": "Ravi Rampaul"
          }
        },
        {
          "name": "RAMPA",
          "meta": {
            "shortened": true,
            "fullName": "Ravi Rampaul"
          }
        },
        {
          "name": "KEEMO",
          "meta": {
            "shortened": false,
            "fullName": "Keemo Paul"
          }
        },
        {
          "name": "PAUL",
          "meta": {
            "shortened": false,
            "fullName": "Keemo Paul"
          }
        },
        {
          "name": "HAYDE",
          "meta": {
            "shortened": true,
            "fullName": "Hayden Walsh"
          }
        },
        {
          "name": "WALSH",
          "meta": {
            "shortened": false,
            "fullName": "Hayden Walsh"
          }
        },
        {
          "name": "ODEAN",
          "meta": {
            "shortened": false,
            "fullName": "Odean Smith"
          }
        },
        {
          "name": "SMITH",
          "meta": {
            "shortened": false,
            "fullName": "Odean Smith"
          }
        },
        {
          "name": "OSHAN",
          "meta": {
            "shortened": true,
            "fullName": "Oshane Thomas"
          }
        },
        {
          "name": "THOMA",
          "meta": {
            "shortened": true,
            "fullName": "Oshane Thomas"
          }
        },
        {
          "name": "OBED",
          "meta": {
            "shortened": false,
            "fullName": "Obed McCoy"
          }
        },
        {
          "name": "MCCOY",
          "meta": {
            "shortened": false,
            "fullName": "Obed McCoy"
          }
        },
        {
          "name": "DOMIN",
          "meta": {
            "shortened": true,
            "fullName": "Dominic Drakes"
          }
        },
        {
          "name": "DRAKE",
          "meta": {
            "shortened": true,
            "fullName": "Dominic Drakes"
          }
        },
        {
          "name": "KAVEM",
          "meta": {
            "shortened": false,
            "fullName": "Kavem Hodge"
          }
        },
        {
          "name": "HODGE",
          "meta": {
            "shortened": false,
            "fullName": "Kavem Hodge"
          }
        },
        {
          "name": "JOSHU",
          "meta": {
            "shortened": true,
            "fullName": "Joshua Da Silva"
          }
        },
        {
          "name": "DA",
          "meta": {
            "shortened": false,
            "fullName": "Joshua Da Silva"
          }
        },
        {
          "name": "SILVA",
          "meta": {
            "shortened": false,
            "fullName": "Joshua Da Silva"
          }
        },
        {
          "name": "CHAND",
          "meta": {
            "shortened": true,
            "fullName": "Chanderpaul Hemraj"
          }
        },
        {
          "name": "HEMRA",
          "meta": {
            "shortened": true,
            "fullName": "Chanderpaul Hemraj"
          }
        },
        {
          "name": "JP",
          "meta": {
            "shortened": false,
            "fullName": "JP Duminy"
          }
        },
        {
          "name": "DUMIN",
          "meta": {
            "shortened": true,
            "fullName": "JP Duminy"
          }
        },
        {
          "name": "RILEE",
          "meta": {
            "shortened": false,
            "fullName": "Rilee Rossouw"
          }
        },
        {
          "name": "ROSSO",
          "meta": {
            "shortened": true,
            "fullName": "Rilee Rossouw"
          }
        },
        {
          "name": "DWAIN",
          "meta": {
            "shortened": true,
            "fullName": "Dwaine Pretorius"
          }
        },
        {
          "name": "PRETO",
          "meta": {
            "shortened": true,
            "fullName": "Dwaine Pretorius"
          }
        },
        {
          "name": "BEURA",
          "meta": {
            "shortened": true,
            "fullName": "Beuran Hendricks"
          }
        },
        {
          "name": "HENDR",
          "meta": {
            "shortened": true,
            "fullName": "Beuran Hendricks"
          }
        },
        {
          "name": "TABRA",
          "meta": {
            "shortened": true,
            "fullName": "Tabraiz Shamsi"
          }
        },
        {
          "name": "SHAMS",
          "meta": {
            "shortened": true,
            "fullName": "Tabraiz Shamsi"
          }
        },
        {
          "name": "KESHA",
          "meta": {
            "shortened": true,
            "fullName": "Keshav Maharaj"
          }
        },
        {
          "name": "MAHAR",
          "meta": {
            "shortened": true,
            "fullName": "Keshav Maharaj"
          }
        },
        {
          "name": "ANDIL",
          "meta": {
            "shortened": true,
            "fullName": "Andile Phehlukwayo"
          }
        },
        {
          "name": "PHEHL",
          "meta": {
            "shortened": true,
            "fullName": "Andile Phehlukwayo"
          }
        },
        {
          "name": "SISAN",
          "meta": {
            "shortened": true,
            "fullName": "Sisanda Magala"
          }
        },
        {
          "name": "MAGAL",
          "meta": {
            "shortened": true,
            "fullName": "Sisanda Magala"
          }
        },
        {
          "name": "GLENT",
          "meta": {
            "shortened": true,
            "fullName": "Glenton Stuurman"
          }
        },
        {
          "name": "STUUR",
          "meta": {
            "shortened": true,
            "fullName": "Glenton Stuurman"
          }
        },
        {
          "name": "NANDR",
          "meta": {
            "shortened": true,
            "fullName": "Nandre Burger"
          }
        },
        {
          "name": "BURGE",
          "meta": {
            "shortened": true,
            "fullName": "Nandre Burger"
          }
        },
        {
          "name": "DEWAL",
          "meta": {
            "shortened": true,
            "fullName": "Dewald Brevis"
          }
        },
        {
          "name": "BREVI",
          "meta": {
            "shortened": true,
            "fullName": "Dewald Brevis"
          }
        },
        {
          "name": "LHUAN",
          "meta": {
            "shortened": false,
            "fullName": "Lhuan dre Pretorius"
          }
        },
        {
          "name": "DRE",
          "meta": {
            "shortened": false,
            "fullName": "Lhuan dre Pretorius"
          }
        },
        {
          "name": "PRETO",
          "meta": {
            "shortened": true,
            "fullName": "Lhuan dre Pretorius"
          }
        },
        {
          "name": "ASIF",
          "meta": {
            "shortened": false,
            "fullName": "Asif Ali"
          }
        },
        {
          "name": "ALI",
          "meta": {
            "shortened": false,
            "fullName": "Asif Ali"
          }
        },
        {
          "name": "HAIDE",
          "meta": {
            "shortened": true,
            "fullName": "Haider Ali"
          }
        },
        {
          "name": "ALI",
          "meta": {
            "shortened": false,
            "fullName": "Haider Ali"
          }
        },
        {
          "name": "KHUSH",
          "meta": {
            "shortened": true,
            "fullName": "Khushdil Shah"
          }
        },
        {
          "name": "SHAH",
          "meta": {
            "shortened": false,
            "fullName": "Khushdil Shah"
          }
        },
        {
          "name": "MOHAM",
          "meta": {
            "shortened": true,
            "fullName": "Mohammad Wasim"
          }
        },
        {
          "name": "WASIM",
          "meta": {
            "shortened": false,
            "fullName": "Mohammad Wasim"
          }
        },
        {
          "name": "AAMER",
          "meta": {
            "shortened": false,
            "fullName": "Aamer Jamal"
          }
        },
        {
          "name": "JAMAL",
          "meta": {
            "shortened": false,
            "fullName": "Aamer Jamal"
          }
        },
        {
          "name": "IHSAN",
          "meta": {
            "shortened": true,
            "fullName": "Ihsanullah"
          }
        },
        {
          "name": "SALMA",
          "meta": {
            "shortened": true,
            "fullName": "Salman Agha"
          }
        },
        {
          "name": "AGHA",
          "meta": {
            "shortened": false,
            "fullName": "Salman Agha"
          }
        },
        {
          "name": "IMAD",
          "meta": {
            "shortened": false,
            "fullName": "Imad Wasim"
          }
        },
        {
          "name": "WASIM",
          "meta": {
            "shortened": false,
            "fullName": "Imad Wasim"
          }
        },
        {
          "name": "ZAMAN",
          "meta": {
            "shortened": false,
            "fullName": "Zaman Khan"
          }
        },
        {
          "name": "KHAN",
          "meta": {
            "shortened": false,
            "fullName": "Zaman Khan"
          }
        },
        {
          "name": "SUFIY",
          "meta": {
            "shortened": true,
            "fullName": "Sufiyan Muqeem"
          }
        },
        {
          "name": "MUQEE",
          "meta": {
            "shortened": true,
            "fullName": "Sufiyan Muqeem"
          }
        },
        {
          "name": "COLIN",
          "meta": {
            "shortened": false,
            "fullName": "Colin de Grandhomme"
          }
        },
        {
          "name": "DE",
          "meta": {
            "shortened": false,
            "fullName": "Colin de Grandhomme"
          }
        },
        {
          "name": "GRAND",
          "meta": {
            "shortened": true,
            "fullName": "Colin de Grandhomme"
          }
        },
        {
          "name": "JAMES",
          "meta": {
            "shortened": false,
            "fullName": "James Neesham"
          }
        },
        {
          "name": "NEESH",
          "meta": {
            "shortened": true,
            "fullName": "James Neesham"
          }
        },
        {
          "name": "MITCH",
          "meta": {
            "shortened": true,
            "fullName": "Mitchell Santner"
          }
        },
        {
          "name": "SANTN",
          "meta": {
            "shortened": true,
            "fullName": "Mitchell Santner"
          }
        },
        {
          "name": "TODD",
          "meta": {
            "shortened": false,
            "fullName": "Todd Astle"
          }
        },
        {
          "name": "ASTLE",
          "meta": {
            "shortened": false,
            "fullName": "Todd Astle"
          }
        },
        {
          "name": "HENRY",
          "meta": {
            "shortened": false,
            "fullName": "Henry Nicholls"
          }
        },
        {
          "name": "NICHO",
          "meta": {
            "shortened": true,
            "fullName": "Henry Nicholls"
          }
        },
        {
          "name": "TOM",
          "meta": {
            "shortened": false,
            "fullName": "Tom Latham"
          }
        },
        {
          "name": "LATHA",
          "meta": {
            "shortened": true,
            "fullName": "Tom Latham"
          }
        },
        {
          "name": "BLAIR",
          "meta": {
            "shortened": false,
            "fullName": "Blair Tickner"
          }
        },
        {
          "name": "TICKN",
          "meta": {
            "shortened": true,
            "fullName": "Blair Tickner"
          }
        },
        {
          "name": "COLE",
          "meta": {
            "shortened": false,
            "fullName": "Cole McConchie"
          }
        },
        {
          "name": "MCCON",
          "meta": {
            "shortened": true,
            "fullName": "Cole McConchie"
          }
        },
        {
          "name": "ISH",
          "meta": {
            "shortened": false,
            "fullName": "Ish Sodhi"
          }
        },
        {
          "name": "SODHI",
          "meta": {
            "shortened": false,
            "fullName": "Ish Sodhi"
          }
        },
        {
          "name": "DOUG",
          "meta": {
            "shortened": false,
            "fullName": "Doug Bracewell"
          }
        },
        {
          "name": "BRACE",
          "meta": {
            "shortened": true,
            "fullName": "Doug Bracewell"
          }
        },
        {
          "name": "COREY",
          "meta": {
            "shortened": false,
            "fullName": "Corey Anderson"
          }
        },
        {
          "name": "ANDER",
          "meta": {
            "shortened": true,
            "fullName": "Corey Anderson"
          }
        },
        {
          "name": "GRANT",
          "meta": {
            "shortened": false,
            "fullName": "Grant Elliott"
          }
        },
        {
          "name": "ELLIO",
          "meta": {
            "shortened": true,
            "fullName": "Grant Elliott"
          }
        },
        {
          "name": "AVISH",
          "meta": {
            "shortened": true,
            "fullName": "Avishka Fernando"
          }
        },
        {
          "name": "FERNA",
          "meta": {
            "shortened": true,
            "fullName": "Avishka Fernando"
          }
        },
        {
          "name": "OSHAD",
          "meta": {
            "shortened": true,
            "fullName": "Oshada Fernando"
          }
        },
        {
          "name": "FERNA",
          "meta": {
            "shortened": true,
            "fullName": "Oshada Fernando"
          }
        },
        {
          "name": "MINOD",
          "meta": {
            "shortened": false,
            "fullName": "Minod Bhanuka"
          }
        },
        {
          "name": "BHANU",
          "meta": {
            "shortened": true,
            "fullName": "Minod Bhanuka"
          }
        },
        {
          "name": "RAMES",
          "meta": {
            "shortened": true,
            "fullName": "Ramesh Mendis"
          }
        },
        {
          "name": "MENDI",
          "meta": {
            "shortened": true,
            "fullName": "Ramesh Mendis"
          }
        },
        {
          "name": "LAHIR",
          "meta": {
            "shortened": true,
            "fullName": "Lahiru Thirimanne"
          }
        },
        {
          "name": "THIRI",
          "meta": {
            "shortened": true,
            "fullName": "Lahiru Thirimanne"
          }
        },
        {
          "name": "DINES",
          "meta": {
            "shortened": true,
            "fullName": "Dinesh Chandimal"
          }
        },
        {
          "name": "CHAND",
          "meta": {
            "shortened": true,
            "fullName": "Dinesh Chandimal"
          }
        },
        {
          "name": "THISA",
          "meta": {
            "shortened": true,
            "fullName": "Thisara Perera"
          }
        },
        {
          "name": "PERER",
          "meta": {
            "shortened": true,
            "fullName": "Thisara Perera"
          }
        },
        {
          "name": "SACHI",
          "meta": {
            "shortened": true,
            "fullName": "Sachith Pathirana"
          }
        },
        {
          "name": "PATHI",
          "meta": {
            "shortened": true,
            "fullName": "Sachith Pathirana"
          }
        },
        {
          "name": "CHAMI",
          "meta": {
            "shortened": true,
            "fullName": "Chamindu Wickramasinghe"
          }
        },
        {
          "name": "WICKR",
          "meta": {
            "shortened": true,
            "fullName": "Chamindu Wickramasinghe"
          }
        },
        {
          "name": "IMRUL",
          "meta": {
            "shortened": false,
            "fullName": "Imrul Kayes"
          }
        },
        {
          "name": "KAYES",
          "meta": {
            "shortened": false,
            "fullName": "Imrul Kayes"
          }
        },
        {
          "name": "SOUMY",
          "meta": {
            "shortened": true,
            "fullName": "Soumya Sarkar"
          }
        },
        {
          "name": "SARKA",
          "meta": {
            "shortened": true,
            "fullName": "Soumya Sarkar"
          }
        },
        {
          "name": "MOHAM",
          "meta": {
            "shortened": true,
            "fullName": "Mohammad Mithun"
          }
        },
        {
          "name": "MITHU",
          "meta": {
            "shortened": true,
            "fullName": "Mohammad Mithun"
          }
        },
        {
          "name": "ANAMU",
          "meta": {
            "shortened": true,
            "fullName": "Anamul Haque"
          }
        },
        {
          "name": "HAQUE",
          "meta": {
            "shortened": false,
            "fullName": "Anamul Haque"
          }
        },
        {
          "name": "SABBI",
          "meta": {
            "shortened": true,
            "fullName": "Sabbir Rahman"
          }
        },
        {
          "name": "RAHMA",
          "meta": {
            "shortened": true,
            "fullName": "Sabbir Rahman"
          }
        },
        {
          "name": "NURUL",
          "meta": {
            "shortened": false,
            "fullName": "Nurul Hasan"
          }
        },
        {
          "name": "HASAN",
          "meta": {
            "shortened": false,
            "fullName": "Nurul Hasan"
          }
        },
        {
          "name": "AFIF",
          "meta": {
            "shortened": false,
            "fullName": "Afif Hossain"
          }
        },
        {
          "name": "HOSSA",
          "meta": {
            "shortened": true,
            "fullName": "Afif Hossain"
          }
        },
        {
          "name": "RISHA",
          "meta": {
            "shortened": true,
            "fullName": "Rishad Hossain"
          }
        },
        {
          "name": "HOSSA",
          "meta": {
            "shortened": true,
            "fullName": "Rishad Hossain"
          }
        },
        {
          "name": "HASAN",
          "meta": {
            "shortened": false,
            "fullName": "Hasan Mahmud"
          }
        },
        {
          "name": "MAHMU",
          "meta": {
            "shortened": true,
            "fullName": "Hasan Mahmud"
          }
        },
        {
          "name": "AMIR",
          "meta": {
            "shortened": false,
            "fullName": "Amir Hamza"
          }
        },
        {
          "name": "HAMZA",
          "meta": {
            "shortened": false,
            "fullName": "Amir Hamza"
          }
        },
        {
          "name": "QAIS",
          "meta": {
            "shortened": false,
            "fullName": "Qais Ahmad"
          }
        },
        {
          "name": "AHMAD",
          "meta": {
            "shortened": false,
            "fullName": "Qais Ahmad"
          }
        },
        {
          "name": "FAREE",
          "meta": {
            "shortened": true,
            "fullName": "Fareed Ahmad"
          }
        },
        {
          "name": "AHMAD",
          "meta": {
            "shortened": false,
            "fullName": "Fareed Ahmad"
          }
        },
        {
          "name": "NIJAT",
          "meta": {
            "shortened": false,
            "fullName": "Nijat Masood"
          }
        },
        {
          "name": "MASOO",
          "meta": {
            "shortened": true,
            "fullName": "Nijat Masood"
          }
        },
        {
          "name": "SALIM",
          "meta": {
            "shortened": false,
            "fullName": "Salim Safi"
          }
        },
        {
          "name": "SAFI",
          "meta": {
            "shortened": false,
            "fullName": "Salim Safi"
          }
        },
        {
          "name": "BREND",
          "meta": {
            "shortened": true,
            "fullName": "Brendon McCullum"
          }
        },
        {
          "name": "MCCUL",
          "meta": {
            "shortened": true,
            "fullName": "Brendon McCullum"
          }
        },
        {
          "name": "DWAYN",
          "meta": {
            "shortened": true,
            "fullName": "Dwayne Smith"
          }
        },
        {
          "name": "SMITH",
          "meta": {
            "shortened": false,
            "fullName": "Dwayne Smith"
          }
        },
        {
          "name": "ADAM",
          "meta": {
            "shortened": false,
            "fullName": "Adam Voges"
          }
        },
        {
          "name": "VOGES",
          "meta": {
            "shortened": false,
            "fullName": "Adam Voges"
          }
        },
        {
          "name": "DIRK",
          "meta": {
            "shortened": false,
            "fullName": "Dirk Nannes"
          }
        },
        {
          "name": "NANNE",
          "meta": {
            "shortened": true,
            "fullName": "Dirk Nannes"
          }
        },
        {
          "name": "LUKE",
          "meta": {
            "shortened": false,
            "fullName": "Luke Wright"
          }
        },
        {
          "name": "WRIGH",
          "meta": {
            "shortened": true,
            "fullName": "Luke Wright"
          }
        },
        {
          "name": "MICHA",
          "meta": {
            "shortened": true,
            "fullName": "Michael Hussey"
          }
        },
        {
          "name": "HUSSE",
          "meta": {
            "shortened": true,
            "fullName": "Michael Hussey"
          }
        },
        {
          "name": "HERSC",
          "meta": {
            "shortened": true,
            "fullName": "Herschelle Gibbs"
          }
        },
        {
          "name": "GIBBS",
          "meta": {
            "shortened": false,
            "fullName": "Herschelle Gibbs"
          }
        },
        {
          "name": "KEVIN",
          "meta": {
            "shortened": false,
            "fullName": "Kevin O Brien"
          }
        },
        {
          "name": "O",
          "meta": {
            "shortened": false,
            "fullName": "Kevin O Brien"
          }
        },
        {
          "name": "BRIEN",
          "meta": {
            "shortened": false,
            "fullName": "Kevin O Brien"
          }
        },
        {
          "name": "THISA",
          "meta": {
            "shortened": true,
            "fullName": "Thisara Perera"
          }
        },
        {
          "name": "PERER",
          "meta": {
            "shortened": true,
            "fullName": "Thisara Perera"
          }
        },
        {
          "name": "SHOAI",
          "meta": {
            "shortened": true,
            "fullName": "Shoaib Akhtar"
          }
        },
        {
          "name": "AKHTA",
          "meta": {
            "shortened": true,
            "fullName": "Shoaib Akhtar"
          }
        },
        {
          "name": "TILLA",
          "meta": {
            "shortened": true,
            "fullName": "Tillakaratne Dilshan"
          }
        },
        {
          "name": "DILSH",
          "meta": {
            "shortened": true,
            "fullName": "Tillakaratne Dilshan"
          }
        },
        {
          "name": "MORNE",
          "meta": {
            "shortened": false,
            "fullName": "Morne Morkel"
          }
        },
        {
          "name": "MORKE",
          "meta": {
            "shortened": true,
            "fullName": "Morne Morkel"
          }
        },
        {
          "name": "WAYNE",
          "meta": {
            "shortened": false,
            "fullName": "Wayne Parnell"
          }
        },
        {
          "name": "PARNE",
          "meta": {
            "shortened": true,
            "fullName": "Wayne Parnell"
          }
        },
        {
          "name": "MARCH",
          "meta": {
            "shortened": true,
            "fullName": "Marchant de Lange"
          }
        },
        {
          "name": "DE",
          "meta": {
            "shortened": false,
            "fullName": "Marchant de Lange"
          }
        },
        {
          "name": "LANGE",
          "meta": {
            "shortened": false,
            "fullName": "Marchant de Lange"
          }
        },
        {
          "name": "ALBIE",
          "meta": {
            "shortened": false,
            "fullName": "Albie Morkel"
          }
        },
        {
          "name": "MORKE",
          "meta": {
            "shortened": true,
            "fullName": "Albie Morkel"
          }
        },
        {
          "name": "FARHA",
          "meta": {
            "shortened": true,
            "fullName": "Farhaan Behardien"
          }
        },
        {
          "name": "BEHAR",
          "meta": {
            "shortened": true,
            "fullName": "Farhaan Behardien"
          }
        },
        {
          "name": "IMRAN",
          "meta": {
            "shortened": false,
            "fullName": "Imran Tahir"
          }
        },
        {
          "name": "TAHIR",
          "meta": {
            "shortened": false,
            "fullName": "Imran Tahir"
          }
        },
        {
          "name": "CHRIS",
          "meta": {
            "shortened": false,
            "fullName": "Chris Morris"
          }
        },
        {
          "name": "MORRI",
          "meta": {
            "shortened": true,
            "fullName": "Chris Morris"
          }
        },
        {
          "name": "LUNGI",
          "meta": {
            "shortened": false,
            "fullName": "Lungi Ngidi"
          }
        },
        {
          "name": "NGIDI",
          "meta": {
            "shortened": false,
            "fullName": "Lungi Ngidi"
          }
        },
        {
          "name": "LOCKI",
          "meta": {
            "shortened": true,
            "fullName": "Lockie Ferguson"
          }
        },
        {
          "name": "FERGU",
          "meta": {
            "shortened": true,
            "fullName": "Lockie Ferguson"
          }
        },
        {
          "name": "TRENT",
          "meta": {
            "shortened": false,
            "fullName": "Trent Boult"
          }
        },
        {
          "name": "BOULT",
          "meta": {
            "shortened": false,
            "fullName": "Trent Boult"
          }
        },
        {
          "name": "MITCH",
          "meta": {
            "shortened": true,
            "fullName": "Mitchell McClenaghan"
          }
        },
        {
          "name": "MCCLE",
          "meta": {
            "shortened": true,
            "fullName": "Mitchell McClenaghan"
          }
        },
        {
          "name": "COLIN",
          "meta": {
            "shortened": false,
            "fullName": "Colin Munro"
          }
        },
        {
          "name": "MUNRO",
          "meta": {
            "shortened": false,
            "fullName": "Colin Munro"
          }
        },
        {
          "name": "ANTON",
          "meta": {
            "shortened": false,
            "fullName": "Anton Devcich"
          }
        },
        {
          "name": "DEVCI",
          "meta": {
            "shortened": true,
            "fullName": "Anton Devcich"
          }
        },
        {
          "name": "JESSE",
          "meta": {
            "shortened": false,
            "fullName": "Jesse Ryder"
          }
        },
        {
          "name": "RYDER",
          "meta": {
            "shortened": false,
            "fullName": "Jesse Ryder"
          }
        },
        {
          "name": "ROSS",
          "meta": {
            "shortened": false,
            "fullName": "Ross Taylor"
          }
        },
        {
          "name": "TAYLO",
          "meta": {
            "shortened": true,
            "fullName": "Ross Taylor"
          }
        },
  { "name": "VAIBH", "meta": {"shortened":true,"fullName":"Vaibhav Suryavanshi"} },
  { "name": "SURYA", "meta": {"shortened":true,"fullName":"Vaibhav Suryavanshi"} },
  { "name": "RAJAT", "meta": {"shortened":false,"fullName":"Rajat Patidar"} },
  { "name": "PATID", "meta": {"shortened":true,"fullName":"Rajat Patidar"} },
  { "name": "HEINR", "meta": {"shortened":true,"fullName":"Heinrich Klaasen"} },
  { "name": "KLAAS", "meta": {"shortened":true,"fullName":"Heinrich Klaasen"} },
];
