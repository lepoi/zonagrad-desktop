import React, { Component } from "react";
import ReactDOMServer from "react-dom/server";

import {
  Position,
  Toaster,
  Button,
  InputGroup,
  ButtonGroup
} from "@blueprintjs/core";

const { constants, csvToJson, electron, fs, path, process } = window;
const { configDir, defaultToast } = constants;
let { baseDir } = constants;
const { nativeImage } = electron;
const { BrowserWindow, dialog } = electron.remote;

const exePath = path.join(configDir, "daemon", "CameraDaemon.exe");
const binToStr = array => {
  var result = "";
  for (var i = 0; i < array.length; i++)
    result += String.fromCharCode(parseInt(array[i]));

  return result;
};

class Photography extends Component {
  constructor(props) {
    super(props);

    this.state = {
      daemon: null,
      camera: false,
      year: false,
      level: false,
      school: false,
      shift: false,
      group: false,
      options: {},
      students: {},
      newStudent: "",
      currentStudent: "",
      lastPhoto: "",
      preview: null,
      scan: ""
    };
  }

  componentDidMount = _ => {
    baseDir = constants.baseDir;
    this.createDisplayWindow("");

    window.addEventListener("keyup", this.handleKeyUp);
    this.setOptions();

    this.setState({ daemon: process.spawn(exePath) }, _ => {
      this.state.daemon.stdout.on("data", data => {
        data = binToStr(data);
        console.log(data);

        if (data.includes("disconnected")) {
          this.setState({ camera: false });
          this.addToast({
            message: "Cámara desconectada",
            intent: "warning"
          });
        } else if (data.includes("connected")) {
          this.setState({ camera: true });
          this.addToast({
            message: "Cámara conectada",
            intent: "success"
          });
        } else if (data.includes("captured")) {
          this.setState({ camera: true });
          this.addToast({
            message: "Fotografía capturada",
            intent: "success"
          });

          if (this.state.currentStudent) {
            const photo = data.split("captured:")[1].replace("\n", "");
            let preview,
              tries = 0;

            // const interval = setInterval(_ => {
            //   if (tries++ > 5) clearInterval(interval);
            //   console.info(photo.slice(0, photo.length - 1));
            console.info(
              "photo copy:",
              photo
                .slice(0, photo.length - 1)
                .replace("Originales con ID", "Originales con nombre")
                .replace("originales con ID", "originales con nombre")
                .replace(
                  this.state.currentStudent,
                  this.state.students[this.state.currentStudent].name
                )
            );

            // setTimeout(
            // _ =>
            fs.createReadStream(photo.slice(0, photo.length - 1)).pipe(
              fs.createWriteStream(
                photo
                  .slice(0, photo.length - 1)
                  .replace("Originales con ID", "Originales con nombre")
                  // .replace("originales con ID", "originales con nombre")
                  .replace(
                    this.state.currentStudent,
                    this.state.students[this.state.currentStudent].name
                  )
              )
            );
            //   500
            // );

            fs.readFile(photo.slice(0, photo.length - 1), (err, data) => {
              if (err) {
                console.error(err);
                return;
              }

              preview = nativeImage.createFromBuffer(data);
              preview = preview.toJPEG(100).toString("base64");

              this.setState(
                prev => {
                  prev.students[this.state.currentStudent].photoTaken = true;
                  prev.students[this.state.currentStudent].photo = photo;

                  return {
                    students: prev.students,
                    lastPhoto: photo,
                    preview
                  };
                }
                // _ => clearInterval(interval)
              );
            });
            // }, 500);
          }
        } else {
          this.setState({ camera: true });
          this.addToast({
            message: data,
            intent: "success"
          });
        }
      });

      this.state.daemon.on("close", _ => {
        this.setState({ camera: false });
        this.addToast({
          message: "Camera Daemon closed",
          intent: "warning"
        });
      });

      this.state.daemon.stderr.on("data", err => {
        err = binToStr(err);
        console.error(err);

        this.setState({ camera: false });
        this.addToast({
          message: "Camera Daemon error!",
          intent: "danger"
        });
      });
    });
  };

  componentWillUnmount = _ => {
    this.state.daemon.stdin.pause();
    this.state.daemon.kill();
    window.removeEventListener("keyup", this.handleKeyUp);
  };

  createDisplayWindow = student => {
    this.setState(
      {
        display: new BrowserWindow({
          title: "Zonagrad",
          frame: true,
          fullscrern: true,
          resizeable: false,
          transparent: false
        })
      },
      _ => {
        this.state.display.setMenu(null);
        this.renderStudentDisplay(student);

        this.state.display.on("closed", () => {
          this.setState({ display: null });
        });
      }
    );
  };

  renderStudentDisplay = student => {
    if (this.state.display === null) return this.createDisplayWindow(student);

    const css = `
      body {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        width: 100%;
        height: 100%;
        margin: 0;
        color: white;
        font-family: verdana;
        text-align: center;
        background: rgb(48, 64, 77);
      }
      h1 {
        font-size: 80px;
      }
      h2 {
        font-size: 60px;
        font-weight: 400 !important;
      }
      img {
        width: 80vh;
        transform: rotate(-90deg);
      }
    `;

    const content = (
      <body>
        <style>{css}</style>
        <div>
          <h2>SIGUIENTE:</h2>
        </div>
        <div>
          <h1>{student}</h1>
        </div>
      </body>
    );
    this.state.display.loadURL(
      "data:text/html;charset=utf-8," + ReactDOMServer.renderToString(content)
    );
  };

  addToast = options => {
    Toaster.create({
      position: Position.BOTTOM_RIGHT
    }).show({
      ...defaultToast,
      ...options
    });
  };

  handleKeyUp = ({ key }) => {
    const { students, scan } = this.state;

    if ((scan + key).includes(".-")) {
      this.setState({ scan: "" });
    } else if (key === "Shift") this.setState({ scan: scan + "." });
    else {
      let sanitized = scan.toUpperCase().replace(".-", "");
      for (let i = 0; i < sanitized.length - 1; i++)
        if (sanitized.charAt(i) == "." && isNaN(sanitized.charAt(i + 1)))
          sanitized = sanitized.slice(0, i) + sanitized.slice(i + 1);

      if (key === "Enter") {
        console.info(students, students[sanitized]);
        if (students[sanitized])
          this.takePhoto(sanitized, students[sanitized].name);
      } else this.setState({ scan: scan + key });
    }
  };

  takePhoto = (id, name) => {
    this.state.daemon.stdin.write(id + "\n");
    this.setState({ currentStudent: id }, _ => this.renderStudentDisplay(name));
    this.addToast({
      intent: "success",
      message: "Alumno seleccionado: " + name
    });
  };

  selectParam = (field, value) => {
    this.setState(
      {
        [field]: value
      },
      this.setOptions
    );
  };

  removeFromState = field => {
    let removed = {};

    switch (field) {
      case "year":
        removed.year = false;
      case "level":
        removed.level = false;
      case "school":
        removed.school = false;
      case "shift":
        removed.shift = false;
      case "group":
        removed.group = false;
        removed.currentStudent = "";
      default:
        break;
    }

    this.setState(removed, this.setOptions);
  };

  setOptions = _ => {
    let newState = {};
    let dirPath = "";
    let search = true;

    const { lstatSync, readdirSync } = fs;
    const isDirectory = source => lstatSync(source).isDirectory();
    const getDirectories = source =>
      readdirSync(source)
        .map(name => ({
          name: name,
          path: path.join(source, name)
        }))
        .filter(dir => isDirectory(dir.path));

    newState.options = {};

    if (!this.state.year) dirPath = baseDir;
    else if (!this.state.level)
      dirPath = path.join(baseDir, this.state.year.toString());
    else if (!this.state.school)
      dirPath = path.join(
        baseDir,
        this.state.year.toString(),
        this.state.level
      );
    else if (!this.state.shift)
      dirPath = path.join(
        baseDir,
        this.state.year.toString(),
        this.state.level,
        this.state.school.toString()
      );
    else if (!this.state.group)
      dirPath = path.join(
        baseDir,
        this.state.year.toString(),
        this.state.level,
        this.state.school.toString(),
        this.state.shift
      );
    else {
      const { year, level, school, shift, group } = this.state;
      const listFile = path.join(
        baseDir,
        year.toString(),
        level,
        school.toString(),
        shift,
        group.toString(),
        "students.csv"
      );
      this.state.daemon.stdin.write(listFile + "\n");

      this.readStudentList();
      search = false;
    }

    if (search && dirPath !== "") {
      getDirectories(dirPath).forEach(
        dir => (newState.options[dir.name] = dir.path)
      );
      this.setState(newState);
    }
  };

  readStudentList = _ => {
    const { year, level, school, shift, group } = this.state;
    const listFile = path.join(
      baseDir,
      year.toString(),
      level,
      school.toString(),
      shift,
      group.toString(),
      "students.csv"
    );

    fs.readFile(listFile, "utf-8", (err, data) => {
      if (err) {
        console.error("An error ocurred reading the file :" + err.message);
        this.addToast({
          message: "Error al leer el archivo",
          intent: "danger"
        });
        return;
      }

      const result = csvToJson.toObject(data, {
        delimiter: ",",
        quote: '"'
      });

      if (result.length === 0) return;

      let students = {};
      result.forEach(
        res =>
          (students[res.id] = {
            name: res.nombre,
            photo: res.foto,
            status: res.status
          })
      );

      this.setState({ students });
    });
  };

  changenewStudent = ({ target }) => {
    this.setState({ [target.id]: target.value });
  };

  addStudent = _ => {
    const { year, level, school, shift, group } = this.state;
    const listFile = path.join(
      baseDir,
      year.toString(),
      level,
      school.toString(),
      shift,
      group.toString(),
      "students.csv"
    );

    fs.readFile(listFile, "utf-8", (err, data) => {
      if (err) {
        console.error("An error ocurred reading the file :" + err.message);
        this.addToast({
          message: "Error al agregar alumno",
          intent: "danger"
        });
        return;
      }

      let result = csvToJson.toObject(data, {
        delimiter: ",",
        quote: '"'
      });

      let newStudent = result[result.length - 1];

      const idArr = newStudent.id.split("-");
      const id = `${idArr[0]}-${Number(idArr[1]) + 1}`;

      const foto = newStudent.foto.replace(
        `${newStudent.id}_${newStudent.nombre}`,
        `${id}_${this.state.newStudent}`
      );

      newStudent = {
        ...newStudent,
        id,
        nombre: this.state.newStudent,
        foto
      };

      result.push(newStudent);

      this.saveStudentList(result);
    });
  };

  deleteStudent = id => {
    const { year, level, school, shift, group } = this.state;
    const listFile = path.join(
      baseDir,
      year.toString(),
      level,
      school.toString(),
      shift,
      group.toString(),
      "students.csv"
    );

    dialog.showMessageBox(
      {
        type: "warning",
        deafaultId: 2,
        title: "Eliminar alumno",
        detail: `Seguro que quiere eliminar a ${this.state.students[id].name} de este grupo?`,
        buttons: ["No", "Sí", "Cancelar"]
      },
      option => {
        if (option !== 1) {
          this.addToast({
            intent: "warning",
            message: "Alumno no seleccionado"
          });
          return;
        }

        fs.readFile(listFile, "utf-8", (err, data) => {
          if (err) {
            console.error("An error ocurred reading the file :" + err.message);
            this.addToast({
              message: "Error al eliminar alumno",
              intent: "danger"
            });
            return;
          }

          let result = csvToJson.toObject(data, {
            delimiter: ",",
            quote: '"'
          });

          result = result.filter(student => student.id !== id);
          this.saveStudentList(result);
        });
      }
    );
  };

  saveStudentList = students => {
    const { year, level, school, shift, group } = this.state;
    let data = [
      "id,nombre,foto,id_escuela,escuela,logoEscuela,nivel,turno,grupo,director,firmaDirector,status"
    ];

    students.forEach(student => {
      let item = "";
      item += `"${student.id}"`;
      item += `,"${student.nombre}"`;
      item += `,"${student.foto}"`;
      item += `,"${student.id_escuela}"`;
      item += `,"${student.escuela}"`;
      item += `,"${student.logoEscuela}"`;
      item += `,"${student.nivel}"`;
      item += `,"${student.turno}"`;
      item += `,"${student.grupo}"`;
      item += `,"${student.director}"`;
      item += `,"${student.firmaDirector}"`;
      item += `,"${student.status || ""}"`;

      data.push(item);
    });

    data = data.join("\n") + "\n";

    const relDest = path.join(
      year.toString(),
      level,
      school,
      shift,
      group,
      "students.csv"
    );

    fs.writeFile(path.join(baseDir, relDest), data, err => {
      if (err) {
        console.error(err);
        return;
      }

      this.readStudentList();
      this.addToast({
        message: "Cambios guardados",
        intent: "success"
      });
    });
  };

  toggleStatus = (id, status) => {
    const { year, level, school, shift, group } = this.state;
    const listFile = path.join(
      baseDir,
      year.toString(),
      level,
      school.toString(),
      shift,
      group.toString(),
      "students.csv"
    );

    fs.readFile(listFile, "utf-8", (err, data) => {
      if (err) {
        console.error("An error ocurred reading the file :" + err.message);
        this.addToast({
          message: "Error al eliminar alumno",
          intent: "danger"
        });
        return;
      }

      let result = csvToJson.toObject(data, {
        delimiter: ",",
        quote: '"'
      });

      result = result.map(student => {
        return student.id === id ? { ...student, status } : student;
      });

      this.saveStudentList(result);
    });
  };

  renderBreadcrumbs = _ => (
    <ul className="bp3-breadcrumbs">
      {this.state.year && (
        <li>
          <a
            className={
              "bp3-breadcrumbs" +
              (this.state.level ? "" : "bp3-breadcrumb-current")
            }
          >
            <Button onClick={this.removeFromState.bind(this, "year")}>
              {this.state.year}
            </Button>
          </a>
        </li>
      )}
      {this.state.level && (
        <li>
          <a
            className={
              "bp3-breadcrumbs" +
              (this.state.school ? "" : "bp3-breadcrumb-current")
            }
          >
            <Button onClick={this.removeFromState.bind(this, "level")}>
              {this.state.level}
            </Button>
          </a>
        </li>
      )}
      {this.state.school && (
        <li>
          <a
            className={
              "bp3-breadcrumbs" +
              (this.state.shift ? "" : "bp3-breadcrumb-current")
            }
          >
            <Button onClick={this.removeFromState.bind(this, "school")}>
              {this.state.school}
            </Button>
          </a>
        </li>
      )}
      {this.state.shift && (
        <li>
          <a
            className={
              "bp3-breadcrumbs" +
              (this.state.group ? "" : "bp3-breadcrumb-current")
            }
          >
            <Button onClick={this.removeFromState.bind(this, "shift")}>
              {this.state.shift}
            </Button>
          </a>
        </li>
      )}
      {this.state.group && (
        <li>
          <a className="bp3-breadcrumbs bp3-breadcrumb-current">
            <Button onClick={this.removeFromState.bind(this, "group")}>
              {this.state.group}
            </Button>
          </a>
        </li>
      )}
    </ul>
  );

  renderSelection = _ => {
    if (!this.state.year) {
      return (
        <div className="row" style={{ justifyContent: "center" }}>
          <div className="selection-wrapper">
            <ButtonGroup style={{ width: 250 }} vertical={true} large={true}>
              {Object.keys(this.state.options).map(option => (
                <Button
                  key={"option-" + option}
                  className="mar-t-s"
                  onClick={this.selectParam.bind(this, "year", option)}
                >
                  {option}
                </Button>
              ))}
            </ButtonGroup>
          </div>
        </div>
      );
    } else if (!this.state.level) {
      return (
        <div className="row" style={{ justifyContent: "center" }}>
          <div className="selection-wrapper">
            <ButtonGroup style={{ width: 250 }} vertical={true} large={true}>
              {Object.keys(this.state.options).map(option => (
                <Button
                  key={"option-" + option}
                  className="mar-t-s"
                  onClick={this.selectParam.bind(this, "level", option)}
                >
                  {option}
                </Button>
              ))}
            </ButtonGroup>
          </div>
        </div>
      );
    } else if (!this.state.school) {
      return (
        <div className="row" style={{ justifyContent: "center" }}>
          <div className="selection-wrapper">
            <ButtonGroup style={{ width: 250 }} vertical={true} large={true}>
              {Object.keys(this.state.options).map(option => (
                <Button
                  key={"option-" + option}
                  className="mar-t-s"
                  onClick={this.selectParam.bind(this, "school", option)}
                >
                  {option}
                </Button>
              ))}
            </ButtonGroup>
          </div>
        </div>
      );
    } else if (!this.state.shift) {
      return (
        <div className="row" style={{ justifyContent: "center" }}>
          <div className="selection-wrapper">
            <ButtonGroup style={{ width: 250 }} vertical={true} large={true}>
              {Object.keys(this.state.options).map(option => (
                <Button
                  key={"option-" + option}
                  className="mar-t-s"
                  onClick={this.selectParam.bind(this, "shift", option)}
                >
                  {option}
                </Button>
              ))}
            </ButtonGroup>
          </div>
        </div>
      );
    }

    return (
      <div className="row" style={{ justifyContent: "center" }}>
        <div className="selection-wrapper">
          <ButtonGroup style={{ width: 250 }} vertical={true} large={true}>
            {Object.keys(this.state.options).map(option => (
              <Button
                key={"option-" + option}
                className="mar-t-s"
                onClick={this.selectParam.bind(this, "group", option)}
              >
                {option}
              </Button>
            ))}
          </ButtonGroup>
        </div>
      </div>
    );
  };

  render = _ => (
    <div id="photography" className="app-route d-f fd-col">
      <h2>
        <Button
          icon="camera"
          className="mar-r-s"
          intent={this.state.camera ? "success" : "danger"}
          onClick={this.renderTest}
        ></Button>
        Photography
      </h2>
      <div className="row mar-t-s">{this.renderBreadcrumbs.bind(this)()}</div>
      {!this.state.group ? (
        this.renderSelection.bind(this)()
      ) : (
        <div>
          <div className="row jc-start pad-t-s">
            <Button intent="primary" onClick={this.addStudent.bind(this)}>
              Agregar alumno
            </Button>
            <InputGroup
              id="newStudent"
              intent="primary"
              value={this.state.newStudent}
              onChange={this.changenewStudent}
            />
          </div>
          <div className="row jc-center">
            <div className="d-f fd-col mar-l-m">
              {Object.keys(this.state.students).map((student, index) => {
                student = { id: student, ...this.state.students[student] };

                const { year, level, school, shift, group } = this.state;
                try {
                  fs.readFileSync(
                    path.join(
                      baseDir,
                      year.toString(),
                      level,
                      school,
                      shift,
                      group,
                      "Originales con ID",
                      `${student.id}.jpg`
                    )
                  );
                  student.photoTaken = true;
                } catch (e) {
                  student.photoTaken = false;
                }

                const intent = student.photoTaken
                  ? "success"
                  : this.state.currentStudent === student.id
                  ? "warning"
                  : "primary";

                return (
                  <ButtonGroup key={"student-" + index} className="mar-t-m">
                    <Button
                      intent="danger"
                      onClick={this.deleteStudent.bind(this, student.id)}
                    >
                      X
                    </Button>
                    {student.status === "ausente" ? (
                      <Button
                        intent="warning"
                        onClick={this.toggleStatus.bind(
                          this,
                          student.id,
                          "dado de baja"
                        )}
                      >
                        Ausente
                      </Button>
                    ) : student.status === "dado de baja" ? (
                      <Button
                        intent="danger"
                        onClick={this.toggleStatus.bind(this, student.id, "")}
                      >
                        Dado de baja
                      </Button>
                    ) : (
                      <Button
                        intent="success"
                        onClick={this.toggleStatus.bind(
                          this,
                          student.id,
                          "ausente"
                        )}
                      >
                        Normal
                      </Button>
                    )}

                    <Button intent={intent} disabled>
                      {student.id}
                    </Button>
                    <Button className="grow-1" intent={intent}>
                      {student.name}
                    </Button>
                    <Button
                      icon="camera"
                      intent={intent}
                      disabled={
                        student.status !== null && student.status !== ""
                      }
                      onClick={this.takePhoto.bind(
                        this,
                        student.id,
                        student.name
                      )}
                    >
                      Fotografía
                    </Button>
                  </ButtonGroup>
                );
              })}
            </div>
            <div className="preview-container">
              {this.state.preview && (
                <img
                  className="d-f fd-col grow-1 mar-s bg-black photography-preview rotate"
                  src={"data:image/jpeg;base64," + this.state.preview}
                />
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Photography;
