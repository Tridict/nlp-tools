// HSK2021词汇表【新】整合版20221018.csv

nn = fs()[0].filter(it=>it.length).map(ln=>ln.split(","));

keys = nn[0];
value_lines = nn.slice(1);

ll = value_lines.map(it=>_.zipObject([
  "id_new", "id", "word", "pinyin", "poses", "example", "level", "rank", "has_homographs"
], it));

ll.forEach(it=>{
  it.id_new = +it.id_new;
  it.id = +it.id;
  it.has_homographs = it.has_homographs?.length ? true : undefined;
  it.poses = it.poses.trim()?.length ? it.poses.split("、") : undefined;
  it.example = it.example?.length ? it.example : undefined;
  it.word = it.word.trim();
  if (it.word=="—帆风顺") {it.word="一帆风顺"};
  if (it.word=="—如既往") {it.word="一如既往"};
  if (it.word.search(/[¹ ² ³ ⁴ ⁵ ⁶ ⁷ ⁸ ⁹ ⁰]+/)>-1) {
    it.spec = it.word.match(/[¹ ² ³ ⁴ ⁵ ⁶ ⁷ ⁸ ⁹ ⁰]+/g)[0];
    it.word = it.word.replace(/[¹ ² ³ ⁴ ⁵ ⁶ ⁷ ⁸ ⁹ ⁰]+/g, "");
  };
});

//

// ii = _.uniq(ll.map(it=>it.拼音).join("")).filter(it=>!it.match(/[\d]|[ \|/·’-]|[a-zA-Z]/g));

// ll.filter(it=>it.拼音?.split("")?.find(xx=>ii.includes(xx)));

// 有些拼音含「'」(89)，极少数拼音含「’」(3)
// 应该都是一个意思：在词中分割元音开头的字

//

// ll.forEach(it=>{
//   for (let key of keys) {
//     if (!it[key]?.length) {
//       it[key] = undefined;
//     };
//   };
//   it.级别=it.级别 ? it.级别.split("、") : undefined;
//   it.词类=it.词类 ? it.词类.split("、") : undefined;
//   it.拼音=it.拼音 ? it.拼音.split("|") : undefined;
// });

log(ll);

// ¹ ² ³ ⁴ ⁵ ⁶ ⁷ ⁸ ⁹ ⁰
log(ll.filter(it=>it.spec));

log(_.uniq(ll.map(it=>it.poses).flat()));

_.toPairs(_.groupBy(ll, "word")).filter(it=>it[1].length>1);


save(ll, "HSK2021词汇表【新】整合版20221018.csv.json");





