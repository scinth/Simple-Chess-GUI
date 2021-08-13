const getCoordinatesFromClick = function (x, y, board_size, perspective) {
	let numberOfChessboardColumnsAndRows = 8;
	let square_size = board_size / numberOfChessboardColumnsAndRows;
	let x_coord = Math.floor(x / square_size);
	let y_coord = Math.floor(y / square_size);
	if (perspective == 'white') y_coord = 7 - y_coord;
	else x_coord = 7 - x_coord;
	return [x_coord, y_coord];
};
const createNewPiece = function (id, token, rank, file) {
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
			// temporary
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
			// temporary
			if (file == 4 && rank == 7) piece.castling = new Castling('black');
	}
	return piece;
};
const createPieceUI = function (piece, perspective) {
	let ui = document.createElement('img');
	ui.id = piece.id;
	ui.src = `./assets/chess_icon_${piece.color}${piece.name}.png`;
	ui.alt = `${piece.color}${piece.name}`;
	setUILocation(
		ui,
		perspective,
		piece.currentFileLocation,
		piece.currentRankLocation
	);
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
			{ once: true }
		);
	} else if (piece.name == 'King') {
		ui.addEventListener(
			'transitionend',
			function () {
				delete piece.castling;
			},
			{ once: true }
		);
		if (piece.color == 'white') whiteKing = piece;
		else blackKing = piece;
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
			{ once: true }
		);
	}
	ui.addEventListener('transitionend', function () {
		this.style.zIndex = '1';
	});
	return ui;
};
const setUILocation = function (ui, perspective, file, rank) {
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
const openGameOverDialog = function (result) {
	let dialog = document.createElement('div');
	let html = `
	<div class="dialog">
		<div id="gameover_box">
			<h1>Game Over</h1>
			<h5>${result}</h5>
			<div class="action_btn">
				<button class="newGame">New Game</button>
			</div>
		</div>
	</div>`;
	dialog.innerHTML = html;
	dialog.className = 'dialog';
	dialog.addEventListener('click', function (e) {
		if (e.target.classList.contains('newGame')) {
			board_element.removeChild(dialog);
			newGame();
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
				src="assets/chess_icon_${color}Queen.png"
				alt="${color}Queen"
			/>
			<img
				name="Rook"
				src="assets/chess_icon_${color}Rook.png"
				alt="${color}Rook"
			/>
			<img
				name="Bishop"
				src="assets/chess_icon_${color}Bishop.png"
				alt="${color}Bishop"
			/>
			<img
				name="Knight"
				src="assets/chess_icon_${color}Knight.png"
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
	promotionName = name;
	promotion.next();
};
const promotePawn = function* (pawn, file, rank, perspective) {
	yield openPromotionBox(turn);
	pawn.name = promotionName;
	pawn.currentFileLocation = file;
	pawn.currentRankLocation = rank;
	board[rank][file] = pawn;
	pawn.ui.addEventListener(
		'transitionend',
		function () {
			this.src = `./assets/chess_icon_${pawn.color}${pawn.name}.png`;
			this.alt = `${pawn.color}${pawn.name}`;
		},
		{ once: true }
	);
	setUILocation(pawn.ui, perspective, file, rank);
};
// highlight functions
const highlightSquare = function (type, perspective, file, rank) {
	let highlight = document.createElement('div');
	highlight.id = `[${file},${rank}]`;
	highlight.classList.add('highlight', type);
	document.getElementById('board').append(highlight);
	setUILocation(highlight, perspective, file, rank);
};
const removeAllHighlight = function (type = '') {
	let board = document.getElementById('board');
	let highlights = [...board.querySelectorAll(`.highlight${type}`)];
	highlights.forEach((highlight) => {
		board.removeChild(highlight);
	});
};
const highlightSquares = function (squares, type, perspective) {
	squares.forEach(([file, rank]) => {
		highlightSquare(type, perspective, file, rank);
	});
};
