import { htmlEscape } from "./html";

const URL_CORS_DOCS = "https://labelstud.io/guide/storage.html#Troubleshoot-CORS-and-access-problems";
const URL_TAGS_DOCS = "https://labelstud.io/tags";

export default {
  DONE: "完成！",
  NO_COMP_LEFT: "没有更多标注",
  NO_NEXT_TASK: "队列中没有更多任务",
  NO_ACCESS: "你无权访问此任务",

  CONFIRM_TO_DELETE_ALL_REGIONS: "请确认是否要删除所有已标注区域",

  // Tree validation messages
  ERR_REQUIRED: ({ modelName, field }) => {
    return `标签 <b>${modelName}</b> 需要属性 <b>${field}</b>`;
  },

  ERR_UNKNOWN_TAG: ({ modelName, field, value }) => {
    return `名称为 <b>${value}</b> 的标签未注册。被 <b>${modelName}#${field}</b> 引用。`;
  },

  ERR_TAG_NOT_FOUND: ({ modelName, field, value }) => {
    return `配置中不存在名为 <b>${value}</b> 的标签。被 <b>${modelName}#${field}</b> 引用。`;
  },

  ERR_TAG_UNSUPPORTED: ({ modelName, field, value, validType }) => {
    return `标签 <b>${modelName}</b> 的属性 <b>${field}</b> 无效：引用的标签为 <b>${value}</b>，但 <b>${modelName}</b> 只能控制 <b>${[]
      .concat(validType)
      .join(", ")}</b>`;
  },

  ERR_PARENT_TAG_UNEXPECTED: ({ validType, value }) => {
    return `标签 <b>${value}</b> 必须是以下标签之一的子级：<b>${[].concat(validType).join(", ")}</b>。`;
  },

  ERR_BAD_TYPE: ({ modelName, field, validType }) => {
    return `标签 <b>${modelName}</b> 的属性 <b>${field}</b> 类型无效。有效类型：<b>${validType}</b>。`;
  },

  ERR_INTERNAL: ({ value }) => {
    return `内部错误。请查看浏览器控制台获取更多信息。请重试或联系开发者。<br/>${value}`;
  },

  ERR_GENERAL: ({ value }) => {
    return value;
  },

  // Object loading errors
  URL_CORS_DOCS,
  URL_TAGS_DOCS,

  ERR_LOADING_AUDIO({ attr, url, error }) {
    return (
      <div data-testid="error:audio">
        <p>
          加载音频时出错。请检查任务中的 <code>{attr}</code> 字段。
        </p>
        <p>技术描述：{error}</p>
        <p>URL: {htmlEscape(url)}</p>
      </div>
    );
  },

  ERR_LOADING_S3({ attr, url }) {
    return `
    <div>
      <p>
        ? <code>${attr}</code> ???? URL ??????
        ???????
        ??????? S3??????????????????
      </p>
      <p>URL: <code><a href="${encodeURI(url)}" target="_blank" rel="noreferrer">${htmlEscape(url)}</a></code></p>
    </div>`;
  },

  ERR_LOADING_CORS({ attr, url }) {
    return `
    <div>
      <p>
        ? <code>${attr}</code> ???? URL ??????
        ?????????? CORS ??????
        <a href="${URL_CORS_DOCS}" target="_blank">???????</a>
      </p>
      <p>
        ??????
        <ul>
          <li>URL ????</li>
          <li>??????</li>
        </ul>
      </p>
      <p>URL: <code><a href="${encodeURI(url)}" target="_blank" rel="noreferrer">${htmlEscape(url)}</a></code></p>
    </div>`;
  },

  ERR_LOADING_HTTP({ attr, url, error }) {
    return `
    <div data-testid="error:http">
      <p>
        ? <code>${attr}</code> ???? URL ?????
      </p>
      <p>
        ??????
        <ul>
          <li>URL ????</li>
          <li>URL ?????????????? https ? https</li>
          <li>
            ?????? CORS ???
            <a href=${URL_CORS_DOCS} target="_blank">??????</a>
          </li>
        </ul>
      </p>
      <p>
        ?????<code>${error}</code>
        <br />
        URL: <code><a href="${encodeURI(url)}" target="_blank" rel="noreferrer">${htmlEscape(url)}</a></code>
      </p>
    </div>`;
  },
};
