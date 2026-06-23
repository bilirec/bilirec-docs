/** @typedef {import('hast').Element} Element */
/** @typedef {import('hast').Root} Root */
/** @typedef {import('hast').Text} Text */

const ENV_HEADER =
	/环境变量|相关环境变量|对应变量|^变量$|^参数$|1080p.*环境变量|4K.*环境变量/i;
const ENV_CODE = /^[A-Z][A-Z0-9_*]+(=.*)?$/;
const ENV_CODE_IN_TEXT = /`([A-Z][A-Z0-9_*]+)`/g;

/**
 * Wrap tables, mark env-var columns, and stack multiple env codes per cell.
 *
 * @returns {import('unified').Plugin<[], Root>}
 */
export function rehypeFormatTables() {
	return (tree) => {
		walk(tree);
	};
}

/**
 * @param {import('hast').Root | Element} node
 */
function walk(node) {
	if (!('children' in node) || !node.children) return;

	for (let i = 0; i < node.children.length; i++) {
		const child = node.children[i];

		if (child.type === 'element' && child.tagName === 'table') {
			wrapAndFormatTable(node, i, child);
			continue;
		}

		walk(child);
	}
}

/**
 * @param {import('hast').Root | Element | import('hast').RootContent} parent
 * @param {number} index
 * @param {Element} table
 */
function wrapAndFormatTable(parent, index, table) {
	if (!('children' in parent) || !parent.children) return;

	const parentClasses = classNames(parent);
	if (
		parentClasses.includes('env-table-scroll') ||
		parentClasses.includes('table-scroll')
	) {
		formatTable(table);
		return;
	}

	parent.children[index] = {
		type: 'element',
		tagName: 'div',
		properties: { className: ['table-scroll'] },
		children: [table],
	};
	formatTable(table);
}

/**
 * @param {Element} table
 */
function formatTable(table) {
	const headerRow = findHeaderRow(table);
	if (!headerRow) return;

	const headers = headerRow.children.filter((child) => child.type === 'element');
	const envColumns = detectEnvColumns(table, headers);

	for (const [index, header] of headers.entries()) {
		if (!envColumns.has(index)) continue;
		addClass(header, 'col-env');
	}

	const bodyRows = findBodyRows(table);
	for (const row of bodyRows) {
		const cells = row.children.filter((child) => child.type === 'element');
		for (const [index, cell] of cells.entries()) {
			if (!envColumns.has(index)) continue;
			addClass(cell, 'col-env');
			normalizeEnvCell(cell);
		}
	}
}

/**
 * @param {Element} table
 * @returns {Element | undefined}
 */
function findHeaderRow(table) {
	const thead = table.children.find(
		(child) => child.type === 'element' && child.tagName === 'thead',
	);
	if (thead?.type === 'element') {
		const row = thead.children.find(
			(child) => child.type === 'element' && child.tagName === 'tr',
		);
		if (row?.type === 'element') return row;
	}

	const firstRow = table.children.find(
		(child) => child.type === 'element' && child.tagName === 'tr',
	);
	return firstRow?.type === 'element' ? firstRow : undefined;
}

/**
 * @param {Element} table
 * @returns {Element[]}
 */
function findBodyRows(table) {
	/** @type {Element[]} */
	const rows = [];
	const tbody = table.children.find(
		(child) => child.type === 'element' && child.tagName === 'tbody',
	);

	if (tbody?.type === 'element') {
		for (const child of tbody.children) {
			if (child.type === 'element' && child.tagName === 'tr') rows.push(child);
		}
		return rows;
	}

	let pastHeader = false;
	for (const child of table.children) {
		if (child.type !== 'element' || child.tagName !== 'tr') continue;
		if (!pastHeader) {
			pastHeader = true;
			continue;
		}
		rows.push(child);
	}
	return rows;
}

/**
 * @param {Element} table
 * @param {Element[]} headers
 * @returns {Set<number>}
 */
function detectEnvColumns(table, headers) {
	/** @type {Set<number>} */
	const envColumns = new Set();

	for (const [index, header] of headers.entries()) {
		if (ENV_HEADER.test(plainText(header))) envColumns.add(index);
	}

	const bodyRows = findBodyRows(table);
	if (bodyRows.length === 0) return envColumns;

	for (let index = 0; index < headers.length; index++) {
		if (envColumns.has(index)) continue;

		let envLike = 0;
		for (const row of bodyRows) {
			const cells = row.children.filter((child) => child.type === 'element');
			const cell = cells[index];
			if (!cell) continue;
			if (isEnvLikeCell(cell)) envLike++;
		}

		if (envLike / bodyRows.length >= 0.6) envColumns.add(index);
	}

	return envColumns;
}

/**
 * @param {Element} cell
 * @returns {boolean}
 */
function isEnvLikeCell(cell) {
	const codes = extractEnvCodes(cell);
	if (codes.length === 0) return false;

	const text = plainText(cell).trim();
	const codeText = codes.join('');
	const compact = text.replace(/[、；;,\s]/g, '');
	return compact === codeText || compact === `${codeText}等`;
}

/**
 * @param {Element} cell
 */
function normalizeEnvCell(cell) {
	const codes = uniqueEnvCodes(extractEnvCodes(cell));
	if (codes.length === 0) return;

	let suffix = plainText(cell);
	for (const code of codes) {
		suffix = suffix.replaceAll(code, '');
	}
	suffix = suffix.replace(/、/g, '').replace(/\s+/g, ' ').trim();
	if (suffix.replace(/\s/g, '') === codes.join('')) {
		suffix = '';
	}

	const onlyOneCode =
		codes.length === 1 &&
		cell.children.length === 1 &&
		cell.children[0].type === 'element' &&
		cell.children[0].tagName === 'code';
	if (onlyOneCode && !suffix) return;

	cell.children = codes.map((value) => makeCode(value));
	if (suffix) {
		cell.children.push(makeSuffix(suffix));
	}
}

/**
 * @param {string} suffix
 * @returns {Element}
 */
function makeSuffix(suffix) {
	const value = suffix === '等' ? ' 等' : ` ${suffix}`;
	return {
		type: 'element',
		tagName: 'span',
		properties: { className: ['env-cell-suffix'] },
		children: [{ type: 'text', value }],
	};
}

/**
 * @param {string[]} codes
 * @returns {string[]}
 */
function uniqueEnvCodes(codes) {
	/** @type {string[]} */
	const ordered = [];
	/** @type {Set<string>} */
	const seen = new Set();
	for (const code of codes) {
		if (seen.has(code)) continue;
		seen.add(code);
		ordered.push(code);
	}
	return ordered;
}

/**
 * @param {Element | Text | import('hast').RootContent} node
 * @returns {string[]}
 */
function extractEnvCodes(node) {
	/** @type {string[]} */
	const codes = [];

	if (node.type === 'element' && node.tagName === 'code') {
		const value = plainText(node).trim();
		if (ENV_CODE.test(value)) codes.push(value);
		return codes;
	}

	if ('children' in node && node.children) {
		for (const child of node.children) {
			codes.push(...extractEnvCodes(child));
		}
	}

	return codes;
}

/**
 * @param {string} value
 * @returns {Element}
 */
function makeCode(value) {
	return {
		type: 'element',
		tagName: 'code',
		properties: { dir: 'auto' },
		children: [{ type: 'text', value }],
	};
}

/**
 * @param {Element} node
 * @param {string} className
 */
function addClass(node, className) {
	const existing = classNames(node);
	if (existing.includes(className)) return;
	node.properties = {
		...node.properties,
		className: [...existing, className],
	};
}

/**
 * @param {import('hast').Root | Element | import('hast').RootContent} node
 * @returns {string[]}
 */
function classNames(node) {
	if (node.type !== 'element') return [];
	const className = node.properties?.className;
	if (!className) return [];
	return Array.isArray(className) ? className.map(String) : [String(className)];
}

/**
 * @param {import('hast').RootContent} node
 * @returns {string}
 */
function plainText(node) {
	if (node.type === 'text') return node.value;
	if (node.type === 'element' && node.children) {
		return node.children.map((child) => plainText(child)).join('');
	}
	return '';
}
