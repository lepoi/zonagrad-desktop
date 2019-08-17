import React, { Component } from 'react';

import {
	NumericInput,
	InputGroup,
	RadioGroup,
	FileInput,
	MenuItem,
	Position,
	Divider,
	Toaster,
	Button,
	Radio,
	Label
} from '@blueprintjs/core';
import {
	EditableCell,
	Column,
	Table,
	Cell
} from '@blueprintjs/table';
import { Select } from '@blueprintjs/select';
import { startOfSecond } from 'date-fns';

const { electron, fs, path, xlsToJson, csvToJson, constants } = window;
const { baseDir, levels, shifts, defaultToast } = constants;
const { remote } = electron;
const { dialog } = remote;

const levelOptions = Object.keys(levels).map(level => ({
	value: level,
	label: levels[level]
}));

const shiftOptions = Object.keys(shifts).map(shift => ({
	value: shift,
	label: shifts[shift]
}));

class Generator extends Component {
	constructor(props) {
		super(props);

		this.state = {
			year: 2018,
			level: -1,
			name: '',
			fullname: '',
			shift: 'M',
			group: 'A',
			rows: 30,
			students: []
		};
	}

	componentWillMount = _ => {
		this.setState({
			year: new Date().getFullYear(),
			level: 'SEC'
		})
	}

	refHandlers = {
		toaster: ref => this.toaster = ref,
	}

	addToast = options => {
		this.toaster.show({
			...defaultToast,
			...options
		});
	}

	changeYear = year => {
		this.setState({ year: year })
	}

	changeLevel = item => {
		this.setState({ level: item.value })
	}

	changeName = ({ target }) => {
		this.setState({ name: target.value })
	}

	changeFullName = ({ target }) => {
		this.setState({ fullname: target.value })
	}

	changeShift = ({ target }) => {
		this.setState({ shift: target.value })
	}	
	
	changeGroup = ({ target }) => {
		this.setState({ group: target.value })
	}	
	
	switchGroup = group => {
		this.setState({ group: group });
	}

	changeRows = rows => {
		this.setState({ rows: rows })
	}	

	changeStudent = (_, index, value) => {
		this.setState(({ students }) => {
			students[index] = value;
			return { students };
		})	
	}	

	renderLevels = (option, { handleClick, modifiers }) => {
		if (!modifiers.matchesPredicate)
			return null;

		return (
			<MenuItem
				key={ option.value }
				text={ option.label }
				label={ option.value }
				onClick={ handleClick }
				active={ modifiers.active }
			/>
		);
	}
	
	idCellRenderer = row => {
		const { year, level, name, shift, group } = this.state;
		return (
			<Cell>
				{ `${year % 100}${level}${name}${shift}${group}${row + 1}` }
			</Cell>
		);
	}

	nameCellRenderer = row => {
		const value = this.state.students[row] || '';
		return <EditableCell
			value={ value }
			onChange={ this.changeStudent.bind(this, value, row) }
		/>;
	}

	saveData = _ => {
		const { students, year, level, fullname, name, shift, group } = this.state;
		this.setState({ students: this.state.students.filter(item => item) });

		const required = [fullname, name, group];
		let requiredLabels = ['Nombre completo', 'Nombre corto', 'Grupo'];
		let requiredFields = ['invalidFullname', 'invalidName', 'invalidGroup']

		requiredLabels = requiredLabels
			.filter((item, index) => required[index].length === 0);
		const requiredInvalid = requiredFields
			.filter((item, index) => required[index].length === 0);

		if (requiredInvalid.length > 0) {
			let invalidFields = {};
			requiredInvalid.forEach(invalid => invalidFields[invalid] = true);

			this.setState(invalidFields, _ => console.log(this.state));
			this.addToast({
				message: `Falta agregar ${requiredLabels.join(', ')}`,
				intent: 'warning'
			});
			return;
		}

		this.setState({
			invalidFullname: false,
			invalidName: false,
			invalidGroup: false
		});

		let result = ['id,nombre,id_escuela,escuela,nivel,turno,grupo,director,firma_director'];

		students.forEach((student, index) => {
			if (!student)
				return;

			let item = '';
			item += `"${year % 100}${level}${name}${shift}${group}${index + 1}"`;
			item += `,"${student}"`;
			item += `,"${name}"`;
			item += `,"${fullname}"`;
			item += `,"${level}"`;
			item += `,"${shift}"`;
			item += `,"${group}"`;
			item += `,"asd"`;
			item += `,"asd"`;

			result.push(item);
		});
		result = result.join('\n') + '\n';
		
		const relDest = path.join(year.toString(), level, fullname, shifts[shift], group, 'students.csv');
		console.log(path.join(baseDir, relDest));

		fs.writeFile(path.join(baseDir, relDest), result, err => {
			if (err) {
				console.error(err);
				return;
			}

			this.addToast({
				message: path.join(baseDir, relDest, 'students.csv'),
				intent: 'success'
			});
		});
	}

	importFile = event => {
		event.preventDefault();

		const { year, level } = this.state;

		dialog.showOpenDialog(
			remote.getCurrentWindow(),
			{
				filters: [
					{
						name: 'Excel o CSV',
						extensions: ['xlsx', 'xls', 'csv']
					},
					{
						name: 'Excel',
						extensions: ['xlsx', 'xls']
					},
					{
						name: 'CSV',
						extensions: ['csv']
					}
				],
				defaultPath: path.join(baseDir, year.toString(), level),
				properties: ['openFile']
			},
			files => {
				if (files === undefined || files.length === 0)
					return;

				let file = files[0];
				let result;

				fs.readFile(file, 'utf-8', (err, data) => {
					if(err) {
						console.error("An error ocurred reading the file :" + err.message);
						return;
					}

					if (file.includes('.csv')) {
						result = csvToJson.toObject(data, {
							relimiter: ',',
							quote: '"'
						});
						console.info(result);

						if (result.length === 0)
							return;

						let newState = {
							year: 2000 + parseInt(result[0].id),
							level: result[0].nivel,
							name: result[0].id_escuela,
							fullname: result[0].escuela,
							shift: result[0].turno,
							group: result[0].grupo,
							rows: Math.max(this.state.rows, result.length),
							principal: result[0].director,
							principalSign: result[0].firma_director,
							students: result.map(res => res.nombre)
						};

						this.setState(newState);
					}
					else {
						result = xlsToJson({ sourceFile: file });
						const sheet = Object.values(result)[0];

						console.log(result[sheet]);
					}
				});
			}
		);
	}

	getGroups = _ => {
		const { fullname, year, level, shift } = this.state;
		const schoolPath = path.join(baseDir, year.toString(), level, fullname, shifts[shift]);
		try {
			const contents = fs.readdirSync(schoolPath);
			console.info(schoolPath);
			console.info(contents);
	
			return contents.filter(item => !item.includes('.'));
		}
		catch (e) {
			return [];
		}
	}

	render = _ => {
		return (
			<div id='generator' className='app-route'>
				<Toaster
					position={ Position.TOP }
					ref={ this.refHandlers.toaster }
				/>
				<div
					className='row'
					style={{ justifyContent: 'center' }}
				>
					<div className='generator-params'>
						<div className='pad-s mar-xs'>
							<Label>
								Importar (.xlsx, .csv)
								<FileInput
									text='Archivo...'
									buttonText='Examinar...'
									onClick={ this.importFile }
								/>
							</Label>
						</div>
						<Divider />
						<div className='pad-s mar-xs'>
							<Label>
								Estudiantes:
								<NumericInput
									allowNumericCharactersOnly={ true }
									style={{ marginTop: 0 }}
									minorStepSize={ 1 }
									majorStepSize={ 10 }
									min={ 1 }
									value={ this.state.rows }
									onValueChange={ this.changeRows }
								/>
							</Label>
						</div>
						<div className='pad-m mar-xs rad-m bg-dark'>
							<Label>
								Año:
								<NumericInput
									allowNumericCharactersOnly={ true }
									style={{ marginTop: 0 }}
									minorStepSize={ 1 }
									majorStepSize={ 5 }
									min={ 2018 }
									value={ this.state.year }
									onValueChange={ this.changeYear }
								/>
							</Label>
							<Label>
								Escuela:
								<Select
									filterable={ false }
									items={ levelOptions }
									onItemSelect={ this.changeLevel }
									itemRenderer={ this.renderLevels }
								>
									<Button
										text={ this.state.level === -1 ?
											'Selecciona uno' :
											`${this.state.level} - ${levels[this.state.level]}`
										}
										style={{ width: '100%' }}
										icon='office'
									/>
								</Select>
								<InputGroup
									value={ this.state.fullname }
									placeholder='Nombre completo'
									onChange={ this.changeFullName }
									intent={ this.state.invalidFullname ? 'danger' : '' }
								/>
								<InputGroup
									value={ this.state.name }
									placeholder='Nombre corto'
									onChange={ this.changeName }
									intent={ this.state.invalidName ? 'danger' : '' }
								/>
							</Label>
							<Label>
								Turno:
								<RadioGroup
									selectedValue={ this.state.shift }
									onChange={ this.changeShift }
								>
									{ shiftOptions.map((option, index) => (
										<Radio
											key={ 'shift-' + index }
											value={ option.value }
											label={ option.label }
										/>
									)) }
								</RadioGroup>
							</Label>
							<Label>
								Grupo
								<InputGroup
									value={ this.state.group }
									onChange={ this.changeGroup }
									intent={ this.state.invalidGroup ? 'danger' : '' }
								/>
							</Label>
							<Button
								text='Guardar'
								intent='primary'
								icon='floppy-disk'
								style={{ width: '100%' }}
								onClick={ this.saveData }
							/>
						</div>
					</div>
					<div>
						<div className='mar-xs row'>
							{ this.getGroups().map((group, index) => (
								<Button
									key={ index }
									text={ group }
									onClick={ this.switchGroup.bind(this, group) }
									intent={ group === this.state.group ? 'success' : 'primary' }
								/>
							)) }
						</div>
						<div className='mar-xs'>
							<Table
								numRows={ this.state.rows }
								columnWidths={ [150, 400] }
								onCopy={ this.handleCopy }
							>
								<Column name='id' cellRenderer={ this.idCellRenderer } />
								<Column name='name' cellRenderer={ this.nameCellRenderer } />
							</Table>
						</div>
					</div>
				</div>
			</div>
		);
	}
};

export default Generator;
