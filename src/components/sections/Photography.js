import React, { Component } from 'react';

import { Button } from '@blueprintjs/core';

const { hid } = window;

class Photography extends Component {
	constructor(props) {
		super(props);

		this.state = {
			camera: null
		};
	}

	connectCamera = _ => {
		console.log(hid.devices());
	}

	render = _ => {
		return (
			<div className='app-route'>
				<h2>
                    Photography
                </h2>
                Camera connected: { this.state.camera ? 'yes' : 'no' }
                <Button onClick={ this.connectCamera.bind(this) }>
                	Connect camera
                </Button>
			</div>
		);
	}
};

export default Photography;