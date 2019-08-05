import React, { Component } from 'react';
import { NavLink } from 'react-router-dom';

class Navbar extends Component {
	constructor(props) {
		super(props);

		this.state = {
			active: '/'
		};
	}

	changeRoute = route =>
		this.setState({ active: route });

	render = _ => {
		const links = [
			{
				route: '/',
				text: 'Generador de códigos',
				icon: 'home'
			},
			{
				route: '/section2',
				text: 'Sección 2',
				icon: 'document'
			}
		]

		return (
			<nav className='app-navbar bp3-navbar'>
				<div className='bp3-navbar-group bp3-align-left'>
					{ links.map((link, index) => (
						<NavLink
							to={ link.route }
							key={ 'nav-link-' + index }
							className={ 'nav-link ' + (this.state.active === link.route ? 'selected' : '') }
							onClick={ this.changeRoute.bind(this, link.route) }
						>
							<button className={ 'bp3-button bp3-icon-' + link.icon }>
								{ link.text }
							</button>
						</NavLink>
					)) }
				</div>
				<div className='bp3-navbar-group bp3-align-right'>
					<div className='bp3-navbar-heading'>
						<h1>
							Zonagrad Desktop
						</h1>
					</div>
				</div>
			</nav>
		);
	}
};

export default Navbar;