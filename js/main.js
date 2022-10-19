// import { reactive, readonly, toRefs, computed, onMounted, onUpdated } from 'vue';
const { reactive, readonly, toRefs, computed, onMounted, onUpdated } = Vue;

const DEVELOPING = location.origin!="https://tridict.github.io";

const API_URL = "https://sp22.nlpsun.cn/api/seg";
// const API_URL = "http://127.0.0.1:8888//api/seg";

const MainApp = {
  setup() {

    // https://blog.csdn.net/u013317445/article/details/117925312
    const HSK_JieBa_POS_MAP = {
      "叹": "y",
      "助": "u",
      "介": "p",
      "量": "q",
      "形": "a",
      "副": "d",
      "名": "n",
      "动": "v",
      "代": "r",
      "连": "c",
      "前缀": "h",
      "后缀": "k",
      "拟声": "o",
      "数": "m",
    };

    const RANK_NUM_MAP = {
      一级: 1,
      二级: 2,
      三级: 3,
      四级: 4,
      五级: 5,
      六级: 6,
      "七-九级": 7,
      跨级词: 100,
      无: 1000,
    };

    const COLOR_VALUE_MAP = {
      "--COLOR-6": "rgb(65, 82, 230)",
      "--COLOR-5": "rgb(12, 166, 218)",
      "--COLOR-4": "rgb(77, 178, 0)",
      "--COLOR-3": "rgb(214, 176, 4)",
      "--COLOR-2": "rgb(252, 134, 38)",
      "--COLOR-1": "rgb(238, 9, 9)",
      "--COLOR-7": "rgb(255, 0, 187)",
    };

    const COLOR_MAP = {
      "一级": COLOR_VALUE_MAP["--COLOR-6"],
      "二级": COLOR_VALUE_MAP["--COLOR-5"],
      "三级": COLOR_VALUE_MAP["--COLOR-4"],
      "四级": COLOR_VALUE_MAP["--COLOR-3"],
      "五级": COLOR_VALUE_MAP["--COLOR-2"],
      "六级": COLOR_VALUE_MAP["--COLOR-1"],
      "七-九级": COLOR_VALUE_MAP["--COLOR-7"],
      "跨级词": "#000",
      "无": "#888",
      "初等": COLOR_VALUE_MAP["--COLOR-5"],
      "中等": COLOR_VALUE_MAP["--COLOR-2"],
      "高等": COLOR_VALUE_MAP["--COLOR-7"],
    };

    const NOT_SURE = Symbol();

    const data = reactive({
      appName: "JsonTool",
      fields: [],
      storeEnabled: true,
      uuidSting: "",
      //
      hsk_db: {},
      //
      "files": [],
      "dic": {},
      //
      text_in: "",
      //
      "outputs": [],
      //
      //
      "status": {
        tab: 1,
        minLen: 2,
        maxLen: 5,
        minFreq: 10,
        maxFreq: -1,
        searchPattern: "",
        searchWindow: 20,
        running: false,
        goon: true,
      },
      "ready": false,
      "settings": {
        dark_mode: false,
      },
      //
      "encodings": ["utf-8", "GBK"],
      //
    });

    const makeUuid = () => {data.uuidSting = uuid();};


    const theStore = reactive(BaseStore(data));
    const theSaver = readonly(BaseSaver(data));
    const theAlert = reactive(BaseAlert());
    // const theAlert = (() => {
    //   const data = reactive({
    //     lastIdx: 1,
    //     alerts: [],
    //   });
    //   const methods = {
    //     pushAlert(ctt = "🐵", typ = "info", tot = 2000) {
    //       console.log(['pushAlert', ctt, typ, tot]);
    //       let idx = data.lastIdx + 1;
    //       data.alerts.push({
    //         'idx': idx,
    //         'type': typ,
    //         'content': ctt,
    //         'show': 1,
    //       });
    //       data.lastIdx += 1;
    //       // let that = self;
    //       setTimeout(() => {
    //         methods.removeAlert(idx);
    //       }, tot);
    //     },
    //     removeAlert(idx) {
    //       data.alerts.find(alert => alert.idx == idx).show = 0;
    //     },
    //   };
    //   return { ...toRefs(data), ...methods };
    // })();
    const theReader = TheReader(theAlert.pushAlert);

    const dark_mode = computed(() => {
      return data.settings.dark_mode;
    });

    const deleteFile = (file) => {
      file.isUsable = false;
      data.files = data.files.filter(x => x.isUsable);
      data.files.forEach(x => x.readed = false);
    };



    const onImport = async (fileList, kind) => {
      let self = data;
      //
      for (let file of fileList) {
        if (self.files.map(f => f.name).includes(file.name)) {
          theAlert.pushAlert(`文件【${file.name}】重复。`)
        } else {
          let fileWrap = {};
          fileWrap.file = file;
          fileWrap.name = file.name;
          fileWrap.isUsable = true;
          fileWrap.readed = false;
          fileWrap.readed2 = false;
          fileWrap.tmp = false;
          fileWrap.encodingGot = false;
          fileWrap.encoding = null;
          fileWrap.kind = kind;
          self.files.push(fileWrap);
          // self.readFile(file);
        }
      };
      for (let fileWrap of self.files) {
        if (!fileWrap.readed) {
          theReader.readFileAsBinaryString(fileWrap, fileWrap.encoding)
            .then(() => {
              theReader.readFile(fileWrap);
            })
            .catch((error) => {
              theAlert.pushAlert(error, 'warning', 5000);
            });
        }
      };
    };



    const onImportJson = async () => {
      let fileList = document.forms["file-form-1"]["file-input-1"].files;
      let result = await onImport(fileList, "Json");
      return result;
    };



    const onImportJsonLines = async () => {
      let fileList = document.forms["file-form-2"]["file-input-2"].files;
      let result = await onImport(fileList, "JsonLines");
      return result;
    };



    const onImportTxt = async () => {
      let fileList = document.forms["file-form-3"]["file-input-3"].files;
      let result = await onImport(fileList, "PlainText");
      return result;
    };



    const onInputTextForSeg = async () => {
      log("onInputTextForSeg");
      log(data.text_in);
      if (!data?.text_in?.length) {
        theAlert.pushAlert(`请先输入要分析的文本`, 'info');
        // return;
        data.text_in = "没有输入句子内容的话，就无法分析了呀。";
      };

      const resp = await axios.post(API_URL, {sentence: data.text_in,});
      log(resp);
      if (resp?.data?.code!=200) {
        theAlert.pushAlert(`出错了`, 'danger');
        return;
      };

      const word_pos_list = resp?.data?.data??[];
      // theAlert.pushAlert(`${word_pos_list}`, 'success');

      theAlert.pushAlert(`${"分析完成"}`, 'success');

      const word_level_list = word_pos_list.map(dog=>{
        const word = dog[0];
        const pos = dog[1];
        if (data.hsk_db?.[word]?.length>1) {
          const choices = data.hsk_db?.[word].filter(item=>{
            if (!item?.poses?.length) {return true;};
            const poses = item.poses.map(pos=>HSK_JieBa_POS_MAP[pos]??"__");
            return poses.includes(pos[0]);
          });
          if (choices?.length>1) {
            const choice = _.sortBy(choices, it=>RANK_NUM_MAP[it.rank]??Infinity)[0];
            return [
              word,
              choice?.["rank"] ?? "无",
              choice?.["level"] ?? "无",
              pos,
              data.hsk_db?.[word],
            ];
          } else {
            return [
              word,
              choices[0]?.["rank"] ?? "无",
              choices[0]?.["level"] ?? "无",
              pos,
              data.hsk_db?.[word],
              NOT_SURE,
            ];
          };
        } else {
          return [
            word,
            data.hsk_db?.[word]?.[0]?.["rank"] ?? "无",
            data.hsk_db?.[word]?.[0]?.["level"] ?? "无",
            pos,
            data.hsk_db?.[word],
          ];
        };
      });
      log(word_level_list);

      const lines = [word_level_list];
      const lines_flat = lines.flat().filter(it=>it[3]!="x"&&it[3]!="eng");
      const lines_uniq = _.uniqBy(lines_flat, "0");

      const statistics = {
        levels: {
          "初等": {name: "初等", count_flat: 0, ratio_flat: 0, count_uniq: 0, ratio_uniq: 0},
          "中等": {name: "中等", count_flat: 0, ratio_flat: 0, count_uniq: 0, ratio_uniq: 0},
          "高等": {name: "高等", count_flat: 0, ratio_flat: 0, count_uniq: 0, ratio_uniq: 0},
          "跨级词": {name: "跨级词", count_flat: 0, ratio_flat: 0, count_uniq: 0, ratio_uniq: 0},
          "无": {name: "无", count_flat: 0, ratio_flat: 0, count_uniq: 0, ratio_uniq: 0},
        },
        ranks: {
          "一级": {name: "一级", count_flat: 0, ratio_flat: 0, count_uniq: 0, ratio_uniq: 0},
          "二级": {name: "二级", count_flat: 0, ratio_flat: 0, count_uniq: 0, ratio_uniq: 0},
          "三级": {name: "三级", count_flat: 0, ratio_flat: 0, count_uniq: 0, ratio_uniq: 0},
          "四级": {name: "四级", count_flat: 0, ratio_flat: 0, count_uniq: 0, ratio_uniq: 0},
          "五级": {name: "五级", count_flat: 0, ratio_flat: 0, count_uniq: 0, ratio_uniq: 0},
          "六级": {name: "六级", count_flat: 0, ratio_flat: 0, count_uniq: 0, ratio_uniq: 0},
          "七-九级": {name: "七-九级", count_flat: 0, ratio_flat: 0, count_uniq: 0, ratio_uniq: 0},
          "跨级词": {name: "跨级词", count_flat: 0, ratio_flat: 0, count_uniq: 0, ratio_uniq: 0},
          "无": {name: "无", count_flat: 0, ratio_flat: 0, count_uniq: 0, ratio_uniq: 0},
        },
      };

      const count_by_rank_flat = _.countBy(lines_flat, "1");
      const count_by_level_flat = _.countBy(lines_flat, "2");
      const sum_flat = lines_flat.length;
      const count_by_rank_uniq = _.countBy(lines_uniq, "1");
      const count_by_level_uniq = _.countBy(lines_uniq, "2");
      const sum_uniq = lines_uniq.length;

      _.toPairs(count_by_rank_flat).forEach(it=>{
        statistics.ranks[it[0]].count_flat = it[1];
        statistics.ranks[it[0]].ratio_flat = it[1]/sum_flat;
      });
      _.toPairs(count_by_level_flat).forEach(it=>{
        statistics.levels[it[0]].count_flat = it[1];
        statistics.levels[it[0]].ratio_flat = it[1]/sum_flat;
      });
      _.toPairs(count_by_rank_uniq).forEach(it=>{
        statistics.ranks[it[0]].count_uniq = it[1];
        statistics.ranks[it[0]].ratio_uniq = it[1]/sum_uniq;
      });
      _.toPairs(count_by_level_uniq).forEach(it=>{
        statistics.levels[it[0]].count_uniq = it[1];
        statistics.levels[it[0]].ratio_uniq = it[1]/sum_uniq;
      });

      const output_item = {
        lines,
        // statistics,
        stat_ranks: _.values(statistics.ranks),
        stat_levels: _.values(statistics.levels),
        sum_flat: sum_flat,
        sum_uniq: sum_uniq,
        uuid: uuid(),
      };
      data.outputs.unshift(output_item);
    };

    const onImportTxtForSeg = async () => {
      let fileList = document.forms["file-form-3"]["file-input-3"].files.slice(0,1);
      data.files = [];
      let result = await onImport(fileList, "PlainText");
      log(result);
    };

    const make_title = (item) => {
      // `级别：${item[1]}\n等次：${item[2]}\n词性：${item[3]}`
      if (item[5]==NOT_SURE) {
        return JSON.stringify(item, null, 2);
      };
      return JSON.stringify(item.slice(0,4), null, 2);
    };











    onMounted(() => {
      // alert("mounted");
      data.ready = false;
      try {
        if (store.enabled) {
          data.storeEnabled = true;
          theStore.load(); //
          theAlert.lastIdx = 1;
          theAlert.alerts = [];
          theAlert.pushAlert(`您好！`, 'success', 3000);
        } else {
          data.storeEnabled = false;
          theAlert.lastIdx = 1;
          theAlert.alerts = [];
          theAlert.pushAlert(`您的浏览器不支持存储功能，请关闭隐私模式，或使用更加现代的浏览器！`, 'warning', 3000);
        };
        //
        data.status.running = false;
        data.status.goon = true;
        data.ready = true;
        //
      } catch (error) {
        console.log(error);
        theAlert.pushAlert(error, 'warning', 5000);
      };
    });


    onMounted(async () => {
      const url_base = DEVELOPING ? `${location.origin}` : `${location.href}`;
      const resp = await axios.get(`${url_base}/db/HSK2021-ranks-csv.json`);
      const items = resp.data;
      data.hsk_db = _.groupBy(items, "word");
      console.log(data.hsk_db);
    });

    onUpdated(() => {
      theStore.save();
    });

    const save = (obj, fileName) => {
      theSaver.save(obj, fileName);
    };

    const saveText = (obj, fileName) => {
      theSaver.saveText(obj, fileName);
    };

    const saveLines = (obj, fileName) => {
      theSaver.saveLines(obj, fileName);
    };

    const fs = () => {
      return data.files.map(x=>
        x.kind=='Json' ? JSON.parse(x.content):
        x.kind=='JsonLines' ? (x.content.replace(/\r/g, '').split(/\n/).filter(t=>t?.length).map(y=>JSON.parse(y))):
        x.kind=='PlainText' ? (x.content.replace(/\r/g, '').split(/\n/)):
        x.content);
    };

    const log = console.log;
    const print = console.log;

    window.log = log;
    window.print = print;

    return { ...toRefs(data), makeUuid, theAlert, theStore, theSaver, theReader, deleteFile, onImportJson, onImportJsonLines, onImportTxt, save, saveText, saveLines, fs, log, print, onInputTextForSeg, onImportTxtForSeg, make_title, COLOR_MAP };
  },
};

const theApp = Vue.createApp(MainApp);
const app = theApp.mount('#app');
const fs = app.fs;
const save = app.save;
const saveText = app.saveText;
const saveLines = app.saveLines;
