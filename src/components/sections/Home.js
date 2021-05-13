import React, { Component } from "react";

import { Button } from "@blueprintjs/core";

const { constants, csvToJson, electron, fs, path, pdf } = window;
const { configDir } = constants;
let { baseDir } = constants;
const { remote } = electron;
const { dialog } = remote;
const { existsSync, readFile, writeFile } = fs;
const { join } = path;

class Home extends Component {
  constructor(props) {
    super(props);

    this.state = {
      directory: ""
    };
  }

  componentDidMount = _ => {
    baseDir = window.constants.baseDir;
    this.setState({
      baseDir: window.constants.baseDir
    });
  };

  convert = _ => {
    dialog.showOpenDialog(
      remote.getCurrentWindow(),
      {
        filters: [
          {
            name: "CSV",
            extensions: ["csv"]
          }
        ],
        defaultPath: path.join(baseDir, new Date().getFullYear().toString()),
        properties: ["openFile"]
      },
      files => {
        try {
          fs.readFile(files[0], "utf-8", (err, data) => {
            if (err) {
              console.error(
                "An error ocurred reading the file :" + err.message
              );
              return;
            }

            const result = csvToJson.toObject(data, {
              delimiter: ",",
              quote: '"'
            });

            result.forEach(res => {
              try {
                const photo = res.foto.replace(
                  "Originales con ID",
                  "Editadas con ID"
                );

                fs.createReadStream(photo).pipe(
                  fs.createWriteStream(
                    photo
                      .replace("Editadas con ID", "Editadas con nombre")
                      .replace(res.id, res.nombre)
                  )
                );
                console.log(
                  photo,
                  photo
                    .replace("Editadas con ID", "Editadas con nombre")
                    .replace(res.id, res.nombre)
                );
              } catch (e) {}
            });
          });
        } catch (e) {
          console.error(e);
        }
      }
    );
  };

  printPhotos = _ => {
    dialog.showOpenDialog(
      remote.getCurrentWindow(),
      {
        filters: [
          {
            name: "CSV",
            extensions: ["csv"]
          }
        ],
        defaultPath: path.join(baseDir, new Date().getFullYear().toString()),
        properties: ["openFile"]
      },
      files => {
        try {
          fs.readFile(files[0], "utf-8", (err, data) => {
            if (err) {
              console.error(
                "An error ocurred reading the file :" + err.message
              );
              return;
            }

            const result = csvToJson.toObject(data, {
              delimiter: ",",
              quote: '"'
            });

            let destPath = files[0].split("\\");
            destPath.pop();
            destPath.push("photos.pdf");
            destPath = destPath.join("\\");

            const doc = new pdf();
            doc.pipe(fs.createWriteStream(destPath));

            const initialX = 55,
              initialY = 50,
              deltaX = 175,
              deltaY = 165,
              perRow = 3,
              perPage = 12;

            result.forEach((res, index) => {
              try {
                const x = initialX + ((index % perPage) % perRow) * deltaX;
                const y =
                  initialY + parseInt((index % perPage) / perRow) * deltaY;

                if (index && index % perPage === 0) doc.addPage().save();

                if (res.status !== "")
                  doc
                    .fontSize(20)
                    .text(`[${res.status.toUpperCase()}]`, x - 25, y + 35, {
                      width: 175,
                      align: "center"
                    });
                else if (fs.existsSync(res.foto))
                  doc
                    .rotate(-90, { origin: [x + 67.5, y + 50] })
                    .image(res.foto, x - 10, y, { width: 145 })
                    .stroke()
                    .rotate(90, { origin: [x + 67.5, y + 50] })
                    .save();

                doc
                  .fontSize(10)
                  .text(res.nombre, x - 25, y + 130, {
                    width: 175,
                    align: "center"
                  })
                  .stroke()
                  .save();
              } catch (e) {
                console.error(e);
              }
            });
            doc
              .save()
              .fill("#FFFFFF")
              .end();
          });
        } catch (e) {
          console.error(e);
        }
      }
    );
  };

  changeDirectory = _ => {
    dialog.showOpenDialog(
      remote.getCurrentWindow(),
      {
        properties: ["openDirectory"]
      },
      dirs => {
        const [dir] = dirs;
        const configFile = join(configDir, "config.json");
        let config = {};

        if (existsSync(configFile))
          readFile(configFile, "utf8", (err, data) => {
            if (err) console.error(err);
            else config = JSON.parse(data);

            writeFile(
              join(configDir, "config.json"),
              JSON.stringify({ ...config, baseDir: dir }),
              err => {
                if (err) return console.error(err);
                console.info("changed baseDir to", dir);

                window.constants.baseDir = dir;
                this.setState({
                  baseDir: window.constants.baseDir
                });
              }
            );
          });
      }
    );
  };

  render = _ => {
    return (
      <div className="app-route">
        <h2>Home</h2>

        <p>
          <Button onClick={this.convert.bind(this)}>
            Convertir Editadas con ID a Editadas con Nombre
          </Button>
        </p>

        <p>
          <Button onClick={this.printPhotos.bind(this)}>
            Imprimir fotos de grupo
          </Button>
        </p>

        <p>
          <Button intent="warning" onClick={this.changeDirectory.bind(this)}>
            Cambiar directorio de trabajo
          </Button>
        </p>
        <div>{this.state.baseDir}</div>
      </div>
    );
  };
}

export default Home;
