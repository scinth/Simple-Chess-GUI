import '../styles/style.scss';
import { SelectedSquare } from './classes';
import { getValidMoves, getGameStatus, getKnightSquares, getRookSquares } from './rules';
import {
	getCoordinatesFromClick,
	createNewPiece,
	createPieceUI,
	setUILocation,
	promotePawn,
	highlightSquare,
	removeAllHighlight,
	highlightSquares,
	generateGameNotation,
	downloadPGN,
	openResetBoardDialog,
	downloadFEN,
	readFENfile,
} from './utilities';

let board_size = 400;
let perspective = 'white';

export let fullmoveNumber = 1;
export let board_element = null;
export let turn = 'white';
export let promotion = null;
export let promotionName = null;
export let enPassant = null;
export let whiteKing = null;
export let blackKing = null;
export let whiteKnightsIntersection = null;
export let blackKnightsIntersection = null;
export let whiteRooksIntersection = null;
export let blackRooksIntersection = null;
export let enableResetBoardButton = null;
export let disableResetBoardButton = null;
export let enableRotateBoardButton = null;
export let disableRotateBoardButton = null;

export const selectedSquare = new SelectedSquare();
const initialPosition = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR';
export const pieces = [];
export const board = [
	[null, null, null, null, null, null, null, null],
	[null, null, null, null, null, null, null, null],
	[null, null, null, null, null, null, null, null],
	[null, null, null, null, null, null, null, null],
	[null, null, null, null, null, null, null, null],
	[null, null, null, null, null, null, null, null],
	[null, null, null, null, null, null, null, null],
	[null, null, null, null, null, null, null, null],
];

export const setWhiteKing = function (value) {
	whiteKing = value;
};
export const setBlackKing = function (value) {
	blackKing = value;
};
export const setPromotionName = function (value) {
	promotionName = value;
};
export const setEnPassant = value => {
	enPassant = value;
};
export const halfmoveClock = {
	value: 0,
	counter: 1,
	tick() {
		this.counter++;
		if (this.counter == 2) {
			this.value++;
			this.counter = 0;
		}
	},
	reset() {
		this.value = 0;
		this.counter = 1;
	},
};
export const incrementFullMoveNumber = () => {
	fullmoveNumber++;
};

// gameflow
const setBoardInitialPosition = function (piecePlacement = initialPosition) {
	board.forEach(rank => rank.fill(null));
	pieces.fill(null);
	board_element.innerHTML = '';
	let rankPlacement = piecePlacement.split('/');
	let rank,
		file,
		rlen = rankPlacement.length;
	let trank = 7;
	let whiteKnights = [];
	let blackKnights = [];
	let whiteRooks = [];
	let blackRooks = [];
	for (rank = 0; rank < rlen; rank++, trank--) {
		let set = rankPlacement[rank].split('');
		let flen = set.length;
		let tfile = 0;
		for (file = 0; file < flen; file++) {
			let token = set[file];
			if (isNaN(token)) {
				let newPiece = createNewPiece(pieces.length, token, trank, tfile);
				pieces.push(newPiece);
				board[trank][tfile] = newPiece;
				newPiece.ui = createPieceUI(newPiece, perspective);
				board_element.append(newPiece.ui);
				tfile++;
				if (token === 'N') whiteKnights.push(newPiece);
				else if (token === 'n') blackKnights.push(newPiece);
				else if (token === 'R') whiteRooks.push(newPiece);
				else if (token === 'r') blackRooks.push(newPiece);
			} else tfile += Number(token);
		}
	}

	let getWhiteKnightsIntersection = (() => {
		if (whiteKnights.length < 2)
			return () => {
				return { isIntersecting: false };
			};
		const [b_knight, g_knight] = whiteKnights;
		return movedKnight => {
			if (b_knight.isCaptured || g_knight.isCaptured) return { isIntersecting: false };
			let b_squares = getKnightSquares(
				b_knight.currentFileLocation,
				b_knight.currentRankLocation,
				'black',
			);
			let g_squares = getKnightSquares(
				g_knight.currentFileLocation,
				g_knight.currentRankLocation,
				'black',
			);
			let isIntersecting = false;
			if (movedKnight === g_knight) {
				isIntersecting = b_squares.some(b_square => {
					return (
						b_square[0] == g_knight.currentFileLocation &&
						b_square[1] == g_knight.currentRankLocation
					);
				});
			} else {
				isIntersecting = g_squares.some(g_square => {
					return (
						g_square[0] == b_knight.currentFileLocation &&
						g_square[1] == b_knight.currentRankLocation
					);
				});
			}

			if (isIntersecting) {
				return {
					isIntersecting,
					intersectionFile:
						movedKnight === b_knight ? g_knight.currentFileLocation : b_knight.currentFileLocation,
				};
			}
			return {
				isIntersecting,
			};
		};
	})();
	let getBlackKnightsIntersection = (() => {
		if (blackKnights.length < 2)
			return () => {
				return { isIntersecting: false };
			};
		const [b_knight, g_knight] = blackKnights;
		return movedKnight => {
			if (b_knight.isCaptured || g_knight.isCaptured) return { isIntersecting: false };
			let b_squares = getKnightSquares(
				b_knight.currentFileLocation,
				b_knight.currentRankLocation,
				'white',
			);
			let g_squares = getKnightSquares(
				g_knight.currentFileLocation,
				g_knight.currentRankLocation,
				'white',
			);
			let isIntersecting = false;
			if (movedKnight === g_knight) {
				isIntersecting = b_squares.some(b_square => {
					return (
						b_square[0] == g_knight.currentFileLocation &&
						b_square[1] == g_knight.currentRankLocation
					);
				});
			} else {
				isIntersecting = g_squares.some(g_square => {
					return (
						g_square[0] == b_knight.currentFileLocation &&
						g_square[1] == b_knight.currentRankLocation
					);
				});
			}

			if (isIntersecting) {
				return {
					isIntersecting,
					intersectionFile:
						movedKnight === b_knight ? g_knight.currentFileLocation : b_knight.currentFileLocation,
				};
			}
			return {
				isIntersecting,
			};
		};
	})();
	let getWhiteRooksIntersection = (() => {
		if (whiteRooks.length < 2)
			return () => {
				return { isIntersecting: false };
			};
		const [a_rook, h_rook] = whiteRooks;
		return (movedPiece, base, target) => {
			if (a_rook.isCaptured || h_rook.isCaptured) return { isIntersecting: false };
			let [baseFile, baseRank] = base;
			let [targetFile, targetRank] = target;
			let otherPiece = movedPiece === a_rook ? h_rook : a_rook;
			let squares = getRookSquares(
				otherPiece.currentFileLocation,
				otherPiece.currentRankLocation,
				'black',
			);
			for (let i = 0; i < squares.length; i++) {
				let [file, rank] = squares[i];
				if (file == baseFile && rank == baseRank)
					return {
						isIntersecting: false,
					};
				if (file == targetFile && rank == targetRank)
					return {
						isIntersecting: true,
						intersectionFile: otherPiece.currentFileLocation,
					};
			}
			return {
				isIntersecting: false,
			};
		};
	})();
	let getBlackRooksIntersection = (() => {
		if (blackRooks.length < 2)
			return () => {
				return { isIntersecting: false };
			};
		const [a_rook, h_rook] = blackRooks;
		return (movedPiece, base, target) => {
			if (a_rook.isCaptured || h_rook.isCaptured) return { isIntersecting: false };
			let [baseFile, baseRank] = base;
			let [targetFile, targetRank] = target;
			let otherPiece = movedPiece === a_rook ? h_rook : a_rook;
			let squares = getRookSquares(
				otherPiece.currentFileLocation,
				otherPiece.currentRankLocation,
				'white',
			);
			for (let i = 0; i < squares.length; i++) {
				let [file, rank] = squares[i];
				if (file == baseFile && rank == baseRank)
					return {
						isIntersecting: false,
					};
				if (file == targetFile && rank == targetRank)
					return {
						isIntersecting: true,
						intersectionFile: otherPiece.currentFileLocation,
					};
			}
			return {
				isIntersecting: false,
			};
		};
	})();
	return [
		getWhiteKnightsIntersection,
		getBlackKnightsIntersection,
		getWhiteRooksIntersection,
		getBlackRooksIntersection,
	];
};
const rotateBoard = function () {
	perspective = perspective == 'white' ? 'black' : 'white';
	board.forEach(rank => {
		rank.forEach(piece => {
			if (piece !== null)
				setUILocation(piece.ui, perspective, piece.currentFileLocation, piece.currentRankLocation);
		});
	});
	let highlights = [...document.getElementsByClassName('highlight')];
	highlights.forEach(highlight => {
		let [file, rank] = eval(highlight.id);
		setUILocation(highlight, perspective, file, rank);
	});
};
const setAnimationSpeed = function () {
	document.documentElement.style.setProperty('--animation-speed', `${this.value}s`);
};
export const newGame = function (piecePlacement = initialPosition) {
	turn = 'white';
	enPassant = null;
	promotion = null;
	promotionName = null;
	whiteKing = null;
	blackKing = null;
	halfmoveClock.reset();
	fullmoveNumber = 1;
	let [
		getWhiteKnightsIntersection,
		getBlackKnightsIntersection,
		getWhiteRooksIntersection,
		getBlackRooksIntersection,
	] = setBoardInitialPosition(piecePlacement);
	whiteKnightsIntersection = getWhiteKnightsIntersection;
	blackKnightsIntersection = getBlackKnightsIntersection;
	whiteRooksIntersection = getWhiteRooksIntersection;
	blackRooksIntersection = getBlackRooksIntersection;
	disableResetBoardButton();
};
export const selectPiece = function (e) {
	let piece = pieces[Number(e.target.id)];
	if (!piece) throw 'piece is undefined at selectPiece function';
	if (piece.color == turn) {
		let [file, rank] = selectedSquare.base || [null, null];
		removeAllHighlight();
		if (file !== null && rank !== null && board[rank][file] === piece) selectedSquare.base = null;
		else {
			selectedSquare.base = [piece.currentFileLocation, piece.currentRankLocation];
			highlightSquare('selected', perspective, ...selectedSquare.base);
		}
	} else {
		if (selectedSquare.base) {
			let [baseFile, baseRank] = selectedSquare.base;
			let targetFile = piece.currentFileLocation;
			let targetRank = piece.currentRankLocation;
			let basePiece = board[baseRank][baseFile];
			let validMoves = getValidMoves(basePiece);
			let isMovingToValidSquare = validMoves.some(([file, rank]) => {
				return targetFile == file && targetRank == rank;
			});
			if (!isMovingToValidSquare) {
				highlightSquares(validMoves, 'moves', perspective);
				return;
			}

			selectedSquare.target = [piece.currentFileLocation, piece.currentRankLocation];
			removeAllHighlight();
			highlightSquare('selected', perspective, ...selectedSquare.target);
			let { base, target } = selectedSquare;
			halfmoveClock.reset();
			if (turn === 'black') fullmoveNumber++;
			capturePieceFromToSquare(...base, ...target);
			if (basePiece.name == 'Pawn') {
				if (
					(basePiece.color == 'white' && targetRank == 7) ||
					(basePiece.color == 'black' && targetRank == 0)
				) {
					return;
				}
			}
			switchTurn();
			let [isInCheck, playerNoMoves] = getGameStatus();
			generateGameNotation(basePiece, base, target, true, isInCheck, playerNoMoves);
		} // else notify who's turn
	}
	e.stopPropagation();
};
export const setTurn = value => {
	turn = value;
};
export const switchTurn = function () {
	turn = turn == 'white' ? 'black' : 'white';
};

// transfer piece data
const putPieceToSquare = function (piece, file, rank) {
	enPassant = null;
	if (piece.name == 'Pawn') {
		let { base, target } = selectedSquare;
		if (piece.color == 'white' && base[1] == 1 && target[1] == 3) {
			enPassant = {
				destinationSquare: piece.enPassant.destinationSquare,
				passantSquare: piece.enPassant.passantSquare,
			};
		} else if (piece.color == 'black' && base[1] == 6 && target[1] == 4) {
			enPassant = {
				destinationSquare: piece.enPassant.destinationSquare,
				passantSquare: piece.enPassant.passantSquare,
			};
		} else if (
			(piece.color == 'white' && target[1] == 7) ||
			(piece.color == 'black' && target[1] == 0)
		) {
			promotion = promotePawn(piece, file, rank, perspective);
			promotion.next();
			return;
		}
	}
	piece.currentFileLocation = file;
	piece.currentRankLocation = rank;
	let capturedPiece = board[rank][file];
	if (capturedPiece !== null) {
		capturedPiece.isCaptured = true;
	}
	board[rank][file] = piece;
	setUILocation(piece.ui, perspective, file, rank);
};
const removePieceFromSquare = function (piece, file, rank) {
	if (piece) {
		board[rank][file] = null;
		board_element.removeChild(piece.ui);
	} else throw 'Piece UI is null or undefined at removePieceFromSquare function';
};
const movePieceFromToSquare = function (baseFile, baseRank, desFile, desRank) {
	let piece = board[baseRank][baseFile];
	if (piece) {
		board[baseRank][baseFile] = null;
		putPieceToSquare(piece, desFile, desRank);
	}
};
const capturePieceFromToSquare = function (baseFile, baseRank, desFile, desRank) {
	let basePiece = board[baseRank][baseFile];
	let targetPiece = board[desRank][desFile];
	basePiece.ui.addEventListener(
		'transitionend',
		function () {
			board_element.removeChild(targetPiece.ui);
		},
		{ once: true },
	);
	board[baseRank][baseFile] = null;
	putPieceToSquare(basePiece, desFile, desRank);
	selectedSquare.reset();
};
const capturePassantPiece = function (base, target, passant) {
	let [baseFile, baseRank] = base;
	let [targetFile, targetRank] = target;
	let [passantFile, passantRank] = passant;
	let piece = board[baseRank][baseFile];
	piece.ui.addEventListener(
		'transitionend',
		function () {
			let target_piece = board[targetRank][targetFile];
			removePieceFromSquare(target_piece, targetFile, targetRank);
		},
		{ once: true },
	);
	movePieceFromToSquare(baseFile, baseRank, passantFile, passantRank);
	halfmoveClock.reset();
	if (turn === 'black') fullmoveNumber++;
};
const castle = function (baseFile, baseRank, targetFile, targetRank) {
	let baseRookCoords, targetRookCoords;
	if (targetFile == 6) {
		baseRookCoords = [7, baseRank];
		targetRookCoords = [5, baseRank];
	} else if (targetFile == 2) {
		baseRookCoords = [0, baseRank];
		targetRookCoords = [3, baseRank];
	}
	movePieceFromToSquare(baseFile, baseRank, targetFile, targetRank);
	movePieceFromToSquare(...baseRookCoords, ...targetRookCoords);
	halfmoveClock.tick();
	if (turn === 'black') fullmoveNumber++;
};

//////////////////////
const setBoardSize = function (size) {
	board_size = size;
	document.documentElement.style.setProperty('--board-width', `${board_size}px`);
};
const resizeBoard = function () {
	let screenWidth = window.innerWidth;
	let screenHeight = window.innerHeight;
	let minSize = Math.min(screenWidth, screenHeight);
	if (minSize > 500) minSize = 500;
	setBoardSize(minSize * 0.9);
};

window.onresize = resizeBoard;
document.addEventListener('DOMContentLoaded', function () {
	resizeBoard();
	const menu = document.getElementById('menu');
	const menu_btn = document.getElementById('menu_btn');
	const settings = document.getElementById('settings');
	const settings_btn = document.getElementById('settings_btn');
	const load_pgn = document.getElementById('load-pgn');
	const load_fen = document.getElementById('load-fen');
	const main = document.getElementsByTagName('main')[0];
	const animation_speed = document.getElementById('animation_speed');
	const download_pgn = document.getElementById('download_pgn');
	const download_fen = document.getElementById('download_fen');
	const reset_board_btn = document.getElementById('reset_board_btn');
	const rotate_board_btn = document.getElementById('rotate_board_btn');
	board_element = document.getElementById('board');
	animation_speed.addEventListener('input', setAnimationSpeed);
	menu_btn.addEventListener('click', () => {
		menu.classList.toggle('active');
		settings.classList.remove('active');
	});
	settings_btn.addEventListener('click', () => {
		settings.classList.toggle('active');
		menu.classList.remove('active');
	});
	main.addEventListener('click', () => {
		menu.classList.remove('active');
		settings.classList.remove('active');
	});
	board_element.addEventListener('click', function (e) {
		let coords;
		removeAllHighlight('.moves');
		if (e.target.classList.contains('highlight')) {
			coords = eval(e.target.id);
		} else {
			coords = getCoordinatesFromClick(e.offsetX, e.offsetY, board_size, perspective);
		}
		if (selectedSquare.base == null) return;
		let [baseFile, baseRank] = selectedSquare.base;
		let [targetFile, targetRank] = coords;
		let piece = board[baseRank][baseFile];
		let validMoves = getValidMoves(piece);
		let isMovingToValidSquare = validMoves.some(([file, rank]) => {
			return targetFile == file && targetRank == rank;
		});
		if (!isMovingToValidSquare) {
			highlightSquares(validMoves, 'moves', perspective);
			return;
		}

		selectedSquare.target = coords;
		if (selectedSquare.isReady) {
			highlightSquare('selected', perspective, ...coords);
			let { base, target } = selectedSquare;
			let isCapture = false;
			let isCastling = false;
			if (selectedSquare.isPassantCapture) {
				capturePassantPiece(base, enPassant.destinationSquare, enPassant.passantSquare);
				isCapture = true;
			} else if (selectedSquare.isCastling) {
				castle(...base, ...target);
				isCastling = true;
			} else {
				if (piece.name == 'Pawn') {
					halfmoveClock.reset();
				} else halfmoveClock.tick();
				if (turn === 'black') fullmoveNumber++;
				movePieceFromToSquare(...base, ...target);
			}
			if (piece.name == 'Pawn') {
				if (
					(piece.color == 'white' && target[1] == 7) ||
					(piece.color == 'black' && target[1] == 0)
				) {
					return;
				}
			}
			selectedSquare.reset();
			switchTurn();
			let [isInCheck, playerNoMoves] = getGameStatus();
			generateGameNotation(piece, base, target, isCapture, isInCheck, playerNoMoves, isCastling);
		}
	});

	const openFileSelection = (fileType, readFile) => {
		let input = document.createElement('input');
		input.setAttribute('type', 'file');
		input.setAttribute('accept', fileType);
		input.addEventListener(
			'change',
			e => {
				readFile(e.target.files[0]);
			},
			{ once: true },
		);
		input.click();
	};

	load_fen.addEventListener('click', () => {
		openFileSelection('.fen', readFENfile);
	});

	enableResetBoardButton = function () {
		reset_board_btn.disabled = false;
	};
	disableResetBoardButton = function () {
		reset_board_btn.disabled = true;
	};
	enableRotateBoardButton = function () {
		rotate_board_btn.disabled = false;
	};
	disableRotateBoardButton = function () {
		rotate_board_btn.disabled = true;
	};

	reset_board_btn.addEventListener('click', () => {
		disableResetBoardButton();
		disableRotateBoardButton();
		openResetBoardDialog();
	});
	rotate_board_btn.addEventListener('click', () => {
		rotateBoard();
	});
	download_pgn.addEventListener('click', () => {
		downloadPGN();
	});
	download_fen.addEventListener('click', () => {
		downloadFEN();
	});
	newGame();
	getGameStatus();
});
