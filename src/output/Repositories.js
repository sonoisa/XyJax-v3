/*************************************************************
 *
 *  Copyright (c) 2011-2021 Isao Sonobe <sonoisa@gmail.com>
 *
 *  Licensed under the Apache License, Version 2.0 (the "License");
 *  you may not use this file except in compliance with the License.
 *  You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 *  Unless required by applicable law or agreed to in writing, software
 *  distributed under the License is distributed on an "AS IS" BASIS,
 *  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 *  See the License for the specific language governing permissions and
 *  limitations under the License.
 */


export class DirRepository {
	constructor() {
		this.userDirMap = {};
	}

	get(dirMain) {
		return this.userDirMap[dirMain];
	}

	put(dirMain, compositeObject) {
		this.userDirMap[dirMain] = compositeObject;
	}
}


export class ModifierRepository {
	constructor() {
		this.userModifierMap = {};
	}

	get(shapeName) {
		var modifier = ModifierRepository.embeddedModifierMap[shapeName];
		if (modifier !== undefined) {
			return modifier;
		}
		return this.userModifierMap[shapeName];
	}

	put(shapeName, modifier) {
		if (ModifierRepository.embeddedModifierMap[shapeName] === undefined) {
			this.userModifierMap[shapeName] = modifier;
		}
	}
}
