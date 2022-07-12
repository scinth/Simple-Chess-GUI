import { Piece, Castling } from './classes';
import {
	selectPiece,
	board_element,
	turn,
	promotion,
	promotionName,
	setPromotionName,
	board,
	whiteKing,
	blackKing,
	setWhiteKing,
	setBlackKing,
	newGame,
	whiteKnightsIntersection,
	blackKnightsIntersection,
	whiteRooksIntersection,
	blackRooksIntersection,
	selectedSquare,
	switchTurn,
	enableRotateBoardButton,
	enableResetBoardButton,
	enPassant,
	halfmoveClock,
	incrementFullMoveNumber,
	fullmoveNumber,
} from './main';

import _white_pawn_ from '../assets/whitepawn.png';
import _white_knight_ from '../assets/whiteknight.png';
import _white_bishop_ from '../assets/whitebishop.png';
import _white_rook_ from '../assets/whiterook.png';
import _white_queen_ from '../assets/whitequeen.png';
import _white_king_ from '../assets/whiteking.png';

import _black_pawn_ from '../assets/blackpawn.png';
import _black_knight_ from '../assets/blackknight.png';
import _black_bishop_ from '../assets/blackbishop.png';
import _black_rook_ from '../assets/blackrook.png';
import _black_queen_ from '../assets/blackqueen.png';
import _black_king_ from '../assets/blackking.png';
import { getGameStatus } from './rules';

const getImagePath = function (color, name) {
	if (color == 'white') {
		switch (name) {
			case 'Pawn':
				return _white_pawn_;
			case 'Knight':
				return _white_knight_;
			case 'Bishop':
				return _white_bishop_;
			case 'Rook':
				return _white_rook_;
			case 'Queen':
				return _white_queen_;
			case 'King':
				return _white_king_;
		}
	} else {
		switch (name) {
			case 'Pawn':
				return _black_pawn_;
			case 'Knight':
				return _black_knight_;
			case 'Bishop':
				return _black_bishop_;
			case 'Rook':
				return _black_rook_;
			case 'Queen':
				return _black_queen_;
			case 'King':
				return _black_king_;
		}
	}
};

export const getCoordinatesFromClick = function (x, y, board_size, perspective) {
	let numberOfChessboardColumnsAndRows = 8;
	let square_size = board_size / numberOfChessboardColumnsAndRows;
	let x_coord = Math.floor(x / square_size);
	let y_coord = Math.floor(y / square_size);
	if (perspective == 'white') y_coord = 7 - y_coord;
	else x_coord = 7 - x_coord;
	return [x_coord, y_coord];
};
export const createNewPiece = function (id, token, rank, file) {
	let piece;
	switch (token) {
		case 'P':
			piece = new Piece(id, 'Pawn', 'white', file, rank);
			piece.enPassant = {
				destinationSquare: [file, rank + 2],
				passantSquare: [file, rank + 1],
			};
			break;
		case 'N':
			piece = new Piece(id, 'Knight', 'white', file, rank);
			break;
		case 'B':
			piece = new Piece(id, 'Bishop', 'white', file, rank);
			break;
		case 'R':
			piece = new Piece(id, 'Rook', 'white', file, rank);
			break;
		case 'Q':
			piece = new Piece(id, 'Queen', 'white', file, rank);
			break;
		case 'K':
			piece = new Piece(id, 'King', 'white', file, rank);
			if (file == 4 && rank == 0) piece.castling = new Castling('white');
			break;
		case 'p':
			piece = new Piece(id, 'Pawn', 'black', file, rank);
			piece.enPassant = {
				destinationSquare: [file, rank - 2],
				passantSquare: [file, rank - 1],
			};
			break;
		case 'n':
			piece = new Piece(id, 'Knight', 'black', file, rank);
			break;
		case 'b':
			piece = new Piece(id, 'Bishop', 'black', file, rank);
			break;
		case 'r':
			piece = new Piece(id, 'Rook', 'black', file, rank);
			break;
		case 'q':
			piece = new Piece(id, 'Queen', 'black', file, rank);
			break;
		case 'k':
			piece = new Piece(id, 'King', 'black', file, rank);
			if (file == 4 && rank == 7) piece.castling = new Castling('black');
	}
	return piece;
};
export const createPieceUI = function (piece, perspective) {
	let ui = document.createElement('img');
	ui.id = piece.id;
	ui.src = getImagePath(piece.color, piece.name);
	ui.alt = `${piece.color}${piece.name}`;
	setUILocation(ui, perspective, piece.currentFileLocation, piece.currentRankLocation);
	ui.addEventListener('click', selectPiece);
	ui.addEventListener('transitionstart', function () {
		this.style.zIndex = '10';
	});
	if (piece.name == 'Pawn') {
		ui.addEventListener(
			'transitionend',
			function () {
				delete piece.enPassant;
			},
			{ once: true },
		);
	} else if (piece.name == 'King') {
		ui.addEventListener(
			'transitionend',
			function () {
				delete piece.castling;
			},
			{ once: true },
		);
		if (piece.color == 'white') setWhiteKing(piece);
		else setBlackKing(piece);
	} else if (piece.name == 'Rook') {
		ui.addEventListener(
			'transitionend',
			function () {
				let king = piece.color == 'white' ? whiteKing : blackKing;
				if (piece.initialFileLocation == 0 && king.castling)
					king.castling.isARookNotMovedYet = false;
				else if (piece.initialFileLocation == 7 && king.castling)
					king.castling.isHRookNotMovedYet = false;
			},
			{ once: true },
		);
	}
	ui.addEventListener('transitionend', function () {
		this.style.zIndex = '1';
	});
	return ui;
};
export const setUILocation = function (ui, perspective, file, rank) {
	let multiplier = 100 / 8;
	if (perspective == 'white') {
		ui.style.left = `${multiplier * file}%`;
		ui.style.bottom = `${multiplier * rank}%`;
		ui.style.right = 'auto';
		ui.style.top = 'auto';
	} else {
		ui.style.right = `${multiplier * file}%`;
		ui.style.top = `${multiplier * rank}%`;
		ui.style.left = 'auto';
		ui.style.bottom = 'auto';
	}
};
export const openResetBoardDialog = function () {
	let dialog = document.createElement('div');
	let html = `
	<div class="dialog">
		<div id="dialog_card">
			<h1>Reset Board</h1>
			<br />
			<h5>Are you sure to reset the board?,<br/>All your progress will be lost.</h5>
			<br/ >
			<div class="action_btn">
				<button class="action">Yes</button>
				<button class="action">No</button>
			</div>
		</div>
	</div>`;
	dialog.innerHTML = html;
	dialog.className = 'dialog';
	dialog.addEventListener('click', function (e) {
		if (e.target.classList.contains('action')) {
			board_element.removeChild(dialog);
			if (e.target.textContent == 'No') {
				enableResetBoardButton();
				enableRotateBoardButton();
				return;
			}
			enableRotateBoardButton();
			newGame();
			clearGameNotation();
		}
		e.stopPropagation();
	});
	board_element.append(dialog);
};
export const openGameOverDialog = function (result) {
	let dialog = document.createElement('div');
	let html = `
	<div class="dialog">
		<div id="dialog_card">
			<h1>Game Over</h1>
			<br />
			<h5>${result}</h5>
			<br />
			<div class="action_btn">
				<button class="action">Reset Board</button>
			</div>
		</div>
	</div>`;
	dialog.innerHTML = html;
	dialog.className = 'dialog';
	dialog.addEventListener('click', function (e) {
		if (e.target.classList.contains('action')) {
			board_element.removeChild(dialog);
			enableRotateBoardButton();
			newGame();
			clearGameNotation();
		}
		e.stopPropagation();
	});
	board_element.append(dialog);
};
const openPromotionBox = function (color) {
	let dialog = document.createElement('div');
	let html = `
		<div id="promotion_box">
			<img
				name="Queen"
				src=${getImagePath(color, 'Queen')}
				alt="${color}Queen"
			/>
			<img
				name="Rook"
				src=${getImagePath(color, 'Rook')}
				alt="${color}Rook"
			/>
			<img
				name="Bishop"
				src=${getImagePath(color, 'Bishop')}
				alt="${color}Bishop"
			/>
			<img
				name="Knight"
				src=${getImagePath(color, 'Knight')}
				alt="${color}Knight"
			/>
		</div>`;
	dialog.innerHTML = html;
	dialog.className = 'dialog';
	dialog.addEventListener('click', function (e) {
		let name = e.target.name;
		if (name === undefined) return;
		promoteTo(name);
		board_element.removeChild(dialog);
		e.stopPropagation();
	});
	board_element.append(dialog);
};
const promoteTo = function (name) {
	setPromotionName(name);
	promotion.next();
};
export const promotePawn = function* (pawn, file, rank, perspective) {
	yield openPromotionBox(turn);
	pawn.ui.addEventListener(
		'transitionend',
		function () {
			this.src = getImagePath(pawn.color, pawn.name);
			this.alt = `${pawn.color}${pawn.name}`;
		},
		{ once: true },
	);
	setUILocation(pawn.ui, perspective, file, rank);
	selectedSquare.reset();
	halfmoveClock.reset();
	if (turn === 'black') incrementFullMoveNumber();
	switchTurn();
	let base = [pawn.currentFileLocation, pawn.currentRankLocation];
	let isCapture = board[rank][file] !== null ? true : false;
	board[rank][file] = pawn;
	pawn.name = promotionName;
	pawn.currentFileLocation = file;
	pawn.currentRankLocation = rank;
	let [isInCheck, playerNoMoves] = getGameStatus();
	generateGameNotation(pawn, base, [file, rank], isCapture, isInCheck, playerNoMoves);
	setPromotionName(null);
};
// highlight functions
export const highlightSquare = function (type, perspective, file, rank) {
	let highlight = document.createElement('div');
	highlight.id = `[${file},${rank}]`;
	highlight.classList.add('highlight', type);
	document.getElementById('board').append(highlight);
	setUILocation(highlight, perspective, file, rank);
};
export const removeAllHighlight = function (type = '') {
	let board = document.getElementById('board');
	let highlights = [...board.querySelectorAll(`.highlight${type}`)];
	highlights.forEach(highlight => {
		board.removeChild(highlight);
	});
};
export const highlightSquares = function (squares, type, perspective) {
	squares.forEach(([file, rank]) => {
		highlightSquare(type, perspective, file, rank);
	});
};

const FILE = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
const convertArrayToNotation = array => {
	let file = FILE[array[0]];
	let rank = array[1] + 1;
	return `${file}${rank}`;
};

const getPieceSymbol = name => {
	switch (name) {
		case 'Pawn':
			return '';
		case 'Knight':
			return 'N';
		default:
			return name.split('')[0];
	}
};

const generateMoveNotation = (piece, base, target, isCapture, isCheck, isGameOver, isCastling) => {
	let targetNotation = convertArrayToNotation(target);
	if (isCastling) {
		if (targetNotation == 'g1' || targetNotation == 'g8') return 'O-O';
		else return 'O-O-O';
	}
	let symbol = '';
	if (piece.name == 'Pawn' || (promotionName !== null && piece.name == promotionName)) {
		if (isCapture) symbol = FILE[base[0]];
	} else symbol = getPieceSymbol(piece.name);
	let intersection = null;
	if (piece.name == 'Knight' && piece.color == 'white')
		intersection = whiteKnightsIntersection(piece);
	else if (piece.name == 'Knight' && piece.color == 'black')
		intersection = blackKnightsIntersection(piece);
	else if (piece.name == 'Rook' && piece.color == 'white')
		intersection = whiteRooksIntersection(piece, base, target);
	else if (piece.name == 'Rook' && piece.color == 'black')
		intersection = blackRooksIntersection(piece, base, target);

	if (intersection?.isIntersecting) {
		let file = intersection.intersectionFile;
		if (file != base[0]) symbol += FILE[base[0]];
		else symbol += base[1] + 1;
	}
	let promotion = promotionName !== null ? `=${getPieceSymbol(promotionName)}` : '';
	let capture = isCapture ? 'x' : '';
	let status = '';
	if (isGameOver) {
		if (isCheck) status = '#';
		else status = '*';
	} else if (isCheck) status = '+';
	let notation = `${symbol}${capture}${targetNotation}${promotion}${status}`;
	return notation;
};

const download = (name, file) => {
	let a = document.createElement('a');
	a.setAttribute('href', file);
	a.setAttribute('download', name);
	document.body.appendChild(a);
	a.click();
	document.body.removeChild(a);
};

export const [generateGameNotation, clearGameNotation, downloadPGN] = (() => {
	let movetext = document.querySelector('.movetext-wrapper p');
	if (movetext == null || movetext == undefined)
		throw 'Unable to query ".movetext-wrapper p" element';
	let moveCount = 1;
	return [
		(
			piece,
			base,
			target,
			isCapture = false,
			isCheck = false,
			isGameOver = false,
			isCastling = false,
		) => {
			let notation = generateMoveNotation(
				piece,
				base,
				target,
				isCapture,
				isCheck,
				isGameOver,
				isCastling,
			);
			let text = '';
			if (piece.color == 'white') text = `${moveCount}. `;
			else moveCount++;
			let span = document.createElement('span');
			span.innerHTML = `${text}${notation} `;
			movetext.append(span);
			movetext.parentElement.scrollTo({
				top: movetext.clientHeight,
				behavior: 'smooth',
			});
			if (moveCount == 1 && piece.color == 'white') enableResetBoardButton();
		},
		() => {
			movetext.innerHTML = '';
			moveCount = 1;
		},
		() => {
			let text = movetext.textContent;
			if (text == '') {
				alert('Nothing to download, movetext is empty');
				return;
			}
			let date = new Date().toISOString();
			download(
				`chessgui-${date}.pgn`,
				'data:text/plain;charset=utf-8,' + encodeURIComponent(text.trimEnd()),
			);
		},
	];
})();

export const downloadFEN = () => {
	let fen = createFEN();
	let date = new Date().toISOString();
	download(`chessgui-${date}.fen`, 'data:text/plain;charset=utf-8,' + encodeURIComponent(fen));
};

const getPiecePlacementNotation = board => {
	let notation = '';
	let file = 0,
		rank = 0;
	let boardSize = board.length;
	for (rank = boardSize - 1; rank >= 0; rank--) {
		let space_counter = 0;
		for (file = 0; file < boardSize; file++) {
			let piece = board[rank][file];
			if (piece !== null) {
				if (space_counter > 0) {
					notation += space_counter;
					space_counter = 0;
				}
				let symbol = getPieceSymbol(piece.name);
				if (symbol === '') symbol = 'P';
				if (piece.color === 'black') symbol = symbol.toLowerCase();
				notation += symbol;
			} else space_counter++;
		}
		if (space_counter > 0) {
			notation += space_counter;
		}
		if (rank > 0) notation += '/';
	}
	return notation;
};

export const createFEN = () => {
	let fen = '';
	// 1. Piece placement
	fen += getPiecePlacementNotation(board) + ' ';
	// 2. Active color
	fen += turn == 'white' ? 'w ' : 'b ';
	// 3. Castling availability
	let castling = '';
	if (whiteKing.castling?.isKingNotMovedYet) {
		castling += whiteKing.castling?.isHRookNotMovedYet ? 'K' : '';
		castling += whiteKing.castling?.isARookNotMovedYet ? 'Q' : '';
	}
	if (blackKing.castling?.isKingNotMovedYet) {
		castling += blackKing.castling?.isHRookNotMovedYet ? 'k' : '';
		castling += blackKing.castling?.isARookNotMovedYet ? 'q' : '';
	}
	if (castling === '') castling = '-';
	fen += castling + ' ';
	// 4. En passant square
	if (enPassant?.passantSquare) {
		fen += convertArrayToNotation(enPassant.passantSquare) + ' ';
	} else fen += '- ';
	// 5. Halfmove clock
	fen += halfmoveClock.value + ' ';
	// 6. Fullmove number
	fen += fullmoveNumber;
	return fen;
};

// const

const fileReaderErrorHandler = e => {
	console.log('Cannot read file: ', e.target.result);
	e.target.removeEventListener('error', fileReaderErrorHandler, false);
	e.target.removeEventListener('load', fileReaderLoadHandler, false);
};

const fileReaderLoadHandler = e => {
	// handle result based on type
	if (e.target.fileType === '.fen') {
		console.log('FEN Success!: ', e.target.result);
	} else if (e.target.fileType === '.pgn') {
		console.log('PGN Success!: ', e.target.result);
	}
	e.target.removeEventListener('error', fileReaderErrorHandler, false);
	e.target.removeEventListener('load', fileReaderLoadHandler, false);
};

const readFile = (file, type) => {
	let reader = new FileReader();
	reader.fileType = type;
	reader.addEventListener('error', fileReaderErrorHandler, false);
	reader.addEventListener('load', fileReaderLoadHandler, false);
	reader.readAsText(file);
};

export const readFENfile = file => {
	let fileType = file.name.slice(-4);
	if (fileType !== '.fen') {
		alert(`Unable to load the file '${fileType}', please select a '.fen' file`);
		return;
	}
	readFile(file, fileType);
};

export const readPGNfile = file => {
	let fileType = file.name.slice(-4);
	if (fileType !== '.pgn') {
		alert(`Unable to load the file '${fileType}', please select a '.pgn' file`);
		return;
	}
	readFile(file, fileType);
};
