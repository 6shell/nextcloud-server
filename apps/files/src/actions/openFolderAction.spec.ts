/**
 * SPDX-FileCopyrightText: 2023 Nextcloud GmbH and Nextcloud contributors
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */
import { File, Folder, Node, Permission, View, DefaultType, FileAction } from '@nextcloud/files'
import { describe, expect, test, vi } from 'vitest'

import { action } from './openFolderAction'

const view = {
	id: 'files',
	name: 'Files',
} as View

describe('Open folder action conditions tests', () => {
	test('Default values', () => {
		const folder = new Folder({
			id: 1,
			source: 'https://cloud.domain.com/remote.php/dav/files/admin/FooBar/',
			owner: 'admin',
			permissions: Permission.READ,
		})

		expect(action).toBeInstanceOf(FileAction)
		expect(action.id).toBe('open-folder')
		expect(action.displayName([folder], view)).toBe('Open folder FooBar')
		expect(action.iconSvgInline([], view)).toMatch(/<svg.+<\/svg>/)
		expect(action.default).toBe(DefaultType.HIDDEN)
		expect(action.order).toBe(-100)
	})
})

describe('Open folder action enabled tests', () => {
	test('Enabled for folders', () => {
		const folder = new Folder({
			id: 1,
			source: 'https://cloud.domain.com/remote.php/dav/files/admin/FooBar/',
			owner: 'admin',
			permissions: Permission.READ,
		})

		expect(action.enabled).toBeDefined()
		expect(action.enabled!([folder], view)).toBe(true)
	})

	test('Disabled for non-dav ressources', () => {
		const folder = new Folder({
			id: 1,
			source: 'https://domain.com/data/FooBar/',
			owner: 'admin',
			permissions: Permission.NONE,
		})

		expect(action.enabled).toBeDefined()
		expect(action.enabled!([folder], view)).toBe(false)
	})

	test('Disabled if more than one node', () => {
		const folder1 = new Folder({
			id: 1,
			source: 'https://cloud.domain.com/remote.php/dav/files/admin/Foo/',
			owner: 'admin',
			permissions: Permission.READ,
		})
		const folder2 = new Folder({
			id: 2,
			source: 'https://cloud.domain.com/remote.php/dav/files/admin/Bar/',
			owner: 'admin',
			permissions: Permission.READ,
		})

		expect(action.enabled).toBeDefined()
		expect(action.enabled!([folder1, folder2], view)).toBe(false)
	})

	test('Disabled for files', () => {
		const file = new File({
			id: 1,
			source: 'https://cloud.domain.com/remote.php/dav/files/admin/Foo/',
			owner: 'admin',
			mime: 'text/plain',
		})

		expect(action.enabled).toBeDefined()
		expect(action.enabled!([file], view)).toBe(false)
	})

	test('Disabled without READ permissions', () => {
		const folder = new Folder({
			id: 1,
			source: 'https://cloud.domain.com/remote.php/dav/files/admin/Foo/',
			owner: 'admin',
			permissions: Permission.NONE,
		})

		expect(action.enabled).toBeDefined()
		expect(action.enabled!([folder], view)).toBe(false)
	})
})

describe('Open folder action execute tests', () => {
	test('Open folder', async () => {
		const goToRouteMock = vi.fn()
		// @ts-expect-error We only mock what needed, we do not need Files.Router.goTo or Files.Navigation
		window.OCP = { Files: { Router: { goToRoute: goToRouteMock } } }

		const folder = new Folder({
			id: 1,
			source: 'https://cloud.domain.com/remote.php/dav/files/admin/FooBar/',
			owner: 'admin',
			permissions: Permission.READ,
		})

		const exec = await action.exec(folder, view, '/')
		// Silent action
		expect(exec).toBe(null)
		expect(goToRouteMock).toBeCalledTimes(1)
		expect(goToRouteMock).toBeCalledWith(null, { fileid: '1', view: 'files' }, { dir: '/FooBar' })
	})

	test('Open folder fails without node', async () => {
		const goToRouteMock = vi.fn()
		// @ts-expect-error We only mock what needed, we do not need Files.Router.goTo or Files.Navigation
		window.OCP = { Files: { Router: { goToRoute: goToRouteMock } } }

		const exec = await action.exec(null as unknown as Node, view, '/')
		expect(exec).toBe(false)
		expect(goToRouteMock).toBeCalledTimes(0)
	})

	test('Open folder fails without Folder', async () => {
		const goToRouteMock = vi.fn()
		// @ts-expect-error We only mock what needed, we do not need Files.Router.goTo or Files.Navigation
		window.OCP = { Files: { Router: { goToRoute: goToRouteMock } } }

		const file = new File({
			id: 1,
			source: 'https://cloud.domain.com/remote.php/dav/files/admin/Foo/',
			owner: 'admin',
			mime: 'text/plain',
		})

		const exec = await action.exec(file, view, '/')
		expect(exec).toBe(false)
		expect(goToRouteMock).toBeCalledTimes(0)
	})
})
