import * as fs from "node:fs/promises";
import * as https from "https";
import * as YAML from "yaml";
import * as Manufacturer from "../config/Manufacturer.json";

async function download() {
  return new Promise<{
    name?: string;
    data: Buffer;
  }>((resolve, reject) => {
    let temp = Buffer.alloc(0);
    https
      .get(Manufacturer.url, (res) => {
        new Date().getTime().toString();
        res.on("data", (chunk) => {
          temp = Buffer.concat([temp, chunk], temp.length + chunk.length);
        });
        res.on("end", () => {
          resolve({
            data: temp,
          });
        });
      })
      .on("error", (e) => {
        console.error(e);
        reject(e);
      });
  });
}

async function save(file: { name?: string; data: Buffer }) {
  const { data, name } = file;
  await fs.writeFile(`config/${Manufacturer.fileName}`, data);
  const config = data.toString("utf-8");
  return config;
}

type YAMLConfig = { [key: string]: any };

// port: 7890
// socks-port: 7891
// redir-port: 7892
// mixed-port: 7890
// allow-lan: false
// mode: rule
// log-level: silent
// external-controller: '0.0.0.0:9090'
// secret: ''

function customYamlConfig(src: string) {
  const config = YAML.parse(src) as YAMLConfig;
  let {
    port,
    "socks-port": socksPort,
    "redir-port": redirPort,
    "allow-lan": allowLan,
    mode,
    "log-level": logLevel,
    "external-controller": externalController,
    ...rest
  } = config;
  logLevel = "info";
  externalController = "127.0.0.1:9090";
  const externalUI = "dashboard";
  const mixedPort = 7890;
  const newConfig = {
    "mixed-port": mixedPort,
    mode,
    "log-level": logLevel,
    "external-controller": externalController,
    "external-ui": externalUI,
    ...rest,
  };
  const newYamlConfig = YAML.stringify(newConfig);
  return newYamlConfig;
}

console.log("1、正在获取新配置");
download()
  .then((data) => {
    console.log("2、已获取最新配置");
    return save(data);
  })
  .then((config) => {
    console.log("3、正在自定义配置");
    return customYamlConfig(config);
  })
  .then(async (customConfig) => {
    console.log("4、正在应用新配置");
    await fs.writeFile(Manufacturer.filePath, customConfig);
    console.log("5、成功应用新配置");
  });
