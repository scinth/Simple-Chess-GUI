var board_element;
var board_size = 400;
var perspective = 'white';
var turn = 'white';
var enPassant = null;
var promotion = null;
var promotionName = null;
var whiteKing = null,
	blackKing = null;

const selectedSquare = new SelectedSquare();
const initialPosition = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR';
const pieces = [];
const board = [
	[null, null, null, null, null, null, null, null],
	[null, null, null, null, null, null, null, null],
	[null, null, null, null, null, null, null, null],
	[null, null, null, null, null, null, null, null],
	[null, null, null, null, null, null, null, null],
	[null, null, null, null, null, null, null, null],
	[null, null, null, null, null, null, null, null],
	[null, null, null, null, null, null, null, null],
];

// gameflow
const setUpBoardInitialPosition = function () {
	board.forEach((rank) => rank.fill(null));
	pieces.fill(null);
	board_element.innerHTML = '';
	let position = initialPosition.split('/');
	let rank,
		file,
		rlen = position.length;
	let trank = 7;
	for (rank = 0; rank < rlen; rank++, trank--) {
		let set = position[rank].split('');
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
			} else tfile += Number(token);
		}
	}
};
const rotateBoard = function () {
	perspective = perspective == 'white' ? 'black' : 'white';
	board.forEach((rank) => {
		rank.forEach((piece) => {
			if (piece !== null)
				setUILocation(
					piece.ui,
					perspective,
					piece.currentFileLocation,
					piece.currentRankLocation
				);
		});
	});
	let highlights = [...document.getElementsByClassName('highlight')];
	highlights.forEach((highlight) => {
		let [file, rank] = eval(highlight.id);
		setUILocation(highlight, perspective, file, rank);
	});
};
const setAnimationSpeed = function () {
	document.documentElement.style.setProperty(
		'--animation-speed',
		`${this.value}s`
	);
};
const newGame = function () {
	perspective = 'white';
	turn = 'white';
	enPassant = null;
	promotion = null;
	promotionName = null;
	whiteKing = null;
	blackKing = null;
	setUpBoardInitialPosition();
};
const selectPiece = function (e) {
	let piece = pieces[Number(e.target.id)];
	if (!piece) throw 'piece is null at selectPiece function';
	if (piece.color == turn) {
		let [file, rank] = selectedSquare.base || [null, null];
		removeAllHighlight();
		if (file !== null && rank !== null && board[rank][file] === piece)
			selectedSquare.base = null;
		else {
			selectedSquare.base = [
				piece.currentFileLocation,
				piece.currentRankLocation,
			];
			highlightSquare('selected', perspective, ...selectedSquare.base);
			// temp
			// if (piece) {
			// 	let moves = getValidMoves(piece);
			// 	highlightSquares(moves, 'moves', perspective);
			// }
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

			selectedSquare.target = [
				piece.currentFileLocation,
				piece.currentRankLocation,
			];
			removeAllHighlight();
			highlightSquare('selected', perspective, ...selectedSquare.target);
			let { base, target } = selectedSquare;
			capturePieceFromToSquare(...base, ...target);
			getGameStatus();
		} else console.log(`${turn}'s turn`);
	}
	e.stopPropagation();
};
const switchTurn = function () {
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
	board[rank][file] = piece;
	setUILocation(piece.ui, perspective, file, rank);
};
const removePieceFromSquare = function (piece, file, rank) {
	if (piece) {
		board[rank][file] = null;
		board_element.removeChild(piece.ui);
	} else
		throw 'Piece UI is null or undefined at removePieceFromSquare function';
};
const movePieceFromToSquare = function (baseFile, baseRank, desFile, desRank) {
	let piece = board[baseRank][baseFile];
	if (piece) {
		board[baseRank][baseFile] = null;
		putPieceToSquare(piece, desFile, desRank);
	}
};
const capturePieceFromToSquare = function (
	baseFile,
	baseRank,
	desFile,
	desRank
) {
	let basePiece = board[baseRank][baseFile];
	let targetPiece = board[desRank][desFile];
	basePiece.ui.addEventListener(
		'transitionend',
		function () {
			board_element.removeChild(targetPiece.ui);
		},
		{ once: true }
	);
	board[baseRank][baseFile] = null;
	putPieceToSquare(basePiece, desFile, desRank);
	selectedSquare.reset();
	switchTurn();
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
		{ once: true }
	);
	movePieceFromToSquare(baseFile, baseRank, passantFile, passantRank);
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
};

//////////////////////
const setBoardSize = function (size) {
	board_size = size;
	document.documentElement.style.setProperty(
		'--board-width',
		`${board_size}px`
	);
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
	let animation_speed = document.getElementById('animation_speed');
	board_element = document.getElementById('board');
	animation_speed.addEventListener('input', setAnimationSpeed);
	board_element.addEventListener('click', function (e) {
		let coords;
		removeAllHighlight('.moves');
		if (e.target.classList.contains('highlight')) {
			coords = eval(e.target.id);
		} else {
			coords = getCoordinatesFromClick(
				e.offsetX,
				e.offsetY,
				board_size,
				perspective
			);
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
			if (selectedSquare.isPassantCapture) {
				capturePassantPiece(
					base,
					enPassant.destinationSquare,
					enPassant.passantSquare
				);
			} else if (selectedSquare.isCastling) {
				castle(...base, ...target);
			} else {
				movePieceFromToSquare(...base, ...target);
			}
			selectedSquare.reset();
			switchTurn();
			getGameStatus();
		}
	});
	newGame();
	getGameStatus();
});
