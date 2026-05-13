const fetchJson = async () => {
  const res = await fetch('https://raw.githubusercontent.com/ayram1/ayram1.github.io/main/repertorio.json');
  const data = await res.json();
  console.log(JSON.stringify(data).slice(0, 500));
};
fetchJson();
