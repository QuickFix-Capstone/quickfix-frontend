const gigs = new Array(6).fill(0).map((_, i) => ({
  id: i + 1,
  title: [
    "Fix leaking faucet",
    "Install ceiling fan",
    "AC tune-up",
    "General handyman",
    "Washer repair",
    "Interior painting",
  ][i],
  price: [80, 120, 140, 70, 110, 300][i],
  rating: [4.9, 4.8, 5.0, 4.7, 4.9, 4.6][i],
  reviews: [120, 95, 34, 210, 64, 48][i],
  img: `https://picsum.photos/seed/gig${i}/640/360`,
  provider: ["Alex P.", "Sam E.", "Casey R.", "Jordan K.", "Taylor M.", "Riley S."][i],
}));

export default gigs;
