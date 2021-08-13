const mockMove = {
	mocks: [],
};
mockMove.removePiece = function (file, rank) {
	let pieceID = board[rank][file].id;
	// let piece = pieces[Number(pieceID)];
	this.mocks.unshift({
		id: pieceID,
		target: null,
	});
	board[rank][file] = null;
};
mockMove.transferPiece = function (from, to) {
	let [baseFile, baseRank] = from;
	let [targetFile, targetRank] = to;
	let pieceID = board[baseRank][baseFile].id;
	let piece = pieces[Number(pieceID)];
	let targetPiece = board[targetRank][targetFile];
	if (targetPiece !== null) {
		this.removePiece(targetFile, targetRank);
	}
	this.mocks.unshift({
		id: pieceID,
		target: [targetFile, targetRank],
	});
	board[baseRank][baseFile] = null;
	board[targetRank][targetFile] = piece;
};
mockMove.resetMocks = function () {
	this.mocks.forEach((mock) => {
		let piece = pieces[Number(mock.id)];
		let baseFile = piece.currentFileLocation;
		let baseRank = piece.currentRankLocation;
		board[baseRank][baseFile] = piece;
		if (mock.target !== null) {
			let [targetFile, targetRank] = mock.target;
			board[targetRank][targetFile] = null;
		}
	});
	this.mocks = [];
};
const isValidSquare = function (file, rank) {
	if (file > -1 && file < 8 && rank > -1 && rank < 8) return true;
	else return false;
};
const isSquareControlled = function (squares, name, color) {
	let i,
		len = squares.length;
	for (i = 0; i < len; i++) {
		let [file, rank] = squares[i];
		let piece = board[rank][file];
		if (piece !== null && piece.color != color) {
			if (
				(typeof name == 'string' && piece.name == name) ||
				(typeof name == 'object' &&
					(piece.name == name[0] || piece.name == name[1]))
			)
				return true;
		}
	}
	return false;
};
const isSquareControlledByPawn = function (file, rank, color) {
	let squares;
	if (color == 'white') squares = getWhitePawnSquares(file, rank, null);
	else squares = getBlackPawnSquares(file, rank, null);
	let isControlled = isSquareControlled(squares, 'Pawn', color);
	return isControlled;
};
const isSquareControlledByKnight = function (file, rank, color) {
	let squares = getKnightSquares(file, rank, color);
	let isControlled = isSquareControlled(squares, 'Knight', color);
	return isControlled;
};
const isSquareControlledByBishopOrQueen = function (file, rank, color) {
	let squares = getBishopSquares(file, rank, color);
	let isControlled = isSquareControlled(squares, ['Bishop', 'Queen'], color);
	return isControlled;
};
const isSquareControlledByRookOrQueen = function (file, rank, color) {
	let squares = getRookSquares(file, rank, color);
	let isControlled = isSquareControlled(squares, ['Rook', 'Queen'], color);
	return isControlled;
};
const isSquareControlledByKing = function (file, rank, color) {
	let squares = getKingSquares(file, rank, color, null);
	let isControlled = isSquareControlled(squares, 'King', color);
	return isControlled;
};
const isKingInCheck = function (file, rank, color) {
	if (
		isSquareControlledByPawn(file, rank, color) ||
		isSquareControlledByKnight(file, rank, color) ||
		isSquareControlledByBishopOrQueen(file, rank, color) ||
		isSquareControlledByRookOrQueen(file, rank, color) ||
		isSquareControlledByKing(file, rank, color)
	)
		return true;
	return false;
};
const getValidMoves = function (piece) {
	let moves;
	let file = piece.currentFileLocation;
	let rank = piece.currentRankLocation;
	let color = piece.color;
	switch (piece.name) {
		case 'Pawn':
			if (color == 'white') {
				moves = getWhitePawnSquares(file, rank, piece.enPassant || null);
			} else {
				moves = getBlackPawnSquares(file, rank, piece.enPassant || null);
			}
			break;
		case 'Knight':
			moves = getKnightSquares(file, rank, color);
			break;
		case 'Bishop':
			moves = getBishopSquares(file, rank, color);
			break;
		case 'Rook':
			moves = getRookSquares(file, rank, color);
			break;
		case 'Queen':
			moves = getQueenSquares(file, rank, color);
			break;
		case 'King':
			moves = getKingSquares(file, rank, color, piece.castling || null);
			break;
		// todo: add other moves here...
		default:
			moves = [];
	}
	let baseSquare = [file, rank];
	let validMoves = [];
	moves.forEach(([file, rank]) => {
		let valid = true;
		mockMove.transferPiece(baseSquare, [file, rank]); // normal moves
		// special move: passant capture
		if (piece.name == 'Pawn' && enPassant !== null) {
			let [passantFile, passantRank] = enPassant.passantSquare;
			if (file == passantFile && rank == passantRank) {
				mockMove.removePiece(...enPassant.destinationSquare);
			}
		}
		let king_file,
			king_rank,
			king_color = piece.color;
		if (piece.name == 'King') {
			king_file = file;
			king_rank = rank;
		} else {
			let king = king_color == 'white' ? whiteKing : blackKing;
			king_file = king.currentFileLocation;
			king_rank = king.currentRankLocation;
		}
		if (isKingInCheck(king_file, king_rank, king_color)) valid = false;
		mockMove.resetMocks();
		if (valid) validMoves.push([file, rank]);
	});
	return validMoves;
};
const hasMovesLeft = function (color) {
	let piecesInTurn = [];
	board.forEach((row) => {
		row.forEach((piece) => {
			if (piece !== null && piece.color == color) piecesInTurn.push(piece);
		});
	});
	return piecesInTurn.some((piece) => getValidMoves(piece).length > 0);
};
const getGameStatus = function () {
	let king = turn == 'white' ? whiteKing : blackKing;
	let kingIsCheck = isKingInCheck(
		king.currentFileLocation,
		king.currentRankLocation,
		turn
	);
	let playerNoMoves = !hasMovesLeft(turn);
	if (playerNoMoves) {
		if (kingIsCheck) {
			let color = turn == 'white' ? 'Black' : 'White';
			openGameOverDialog(`${color} wins by Checkmate!`);
		} else openGameOverDialog('Draw by Stalemate');
	} else if (kingIsCheck) console.log('Check!');
};
///////
// short range pieces
const getKnightSquares = function (file, rank, color) {
	let path = [
		[-1, 2],
		[1, 2],
		[2, 1],
		[2, -1],
		[1, -2],
		[-1, -2],
		[-2, -1],
		[-2, 1],
	];
	let moves = [];
	path.forEach(([file_map, rank_map]) => {
		let target_file = file + file_map;
		let target_rank = rank + rank_map;
		if (isValidSquare(target_file, target_rank)) {
			if (board[target_rank][target_file] == null) {
				moves.push([target_file, target_rank]);
			} else {
				if (board[target_rank][target_file].color != color) {
					moves.push([target_file, target_rank]);
				}
			}
		}
	});
	return moves;
};
const getPawnSquares = function (path, file, rank, color, passant) {
	let moves = [];
	if (passant) {
		let [desFile, desRank] = passant.destinationSquare;
		let [pasFile, pasRank] = passant.passantSquare;
		if (board[pasRank][pasFile] === null && board[desRank][desFile] === null)
			moves.push(passant.destinationSquare);
	}
	path.forEach(([file_map, rank_map], index) => {
		let target_file = file + file_map;
		let target_rank = rank + rank_map;
		if (isValidSquare(target_file, target_rank)) {
			if (index == 0) {
				if (board[target_rank][target_file] == null)
					moves.push([target_file, target_rank]);
			} else if (board[target_rank][target_file] !== null) {
				if (board[target_rank][target_file].color != color)
					moves.push([target_file, target_rank]);
			} else if (enPassant !== null) {
				let [file, rank] = enPassant.passantSquare;
				if (target_file == file && target_rank == rank)
					moves.push(enPassant.passantSquare);
			}
		}
	});
	return moves;
};
const getWhitePawnSquares = function (file, rank, enPassant) {
	let path = [
		[0, 1],
		[-1, 1],
		[1, 1],
	];
	let moves = getPawnSquares(path, file, rank, 'white', enPassant);
	return moves;
};
const getBlackPawnSquares = function (file, rank, enPassant) {
	let path = [
		[0, -1],
		[-1, -1],
		[1, -1],
	];
	let moves = getPawnSquares(path, file, rank, 'black', enPassant);
	return moves;
};
const getKingSquares = function (file, rank, color, castling) {
	let path = [
		[-1, 1],
		[0, 1],
		[1, 1],
		[-1, 0],
		[1, 0],
		[-1, -1],
		[0, -1],
		[1, -1],
	];
	let moves = [];
	path.forEach(([file_map, rank_map]) => {
		let target_file = file + file_map;
		let target_rank = rank + rank_map;
		if (isValidSquare(target_file, target_rank)) {
			if (board[target_rank][target_file] === null) {
				moves.push([target_file, target_rank]);
			} else if (board[target_rank][target_file].color != color) {
				moves.push([target_file, target_rank]);
			} else if (castling !== null) {
				let king = color == 'white' ? whiteKing : blackKing;
				if (
					!isKingInCheck(
						king.currentFileLocation,
						king.currentRankLocation,
						color
					)
				) {
					if (castling.canCastleKingside) moves.push(castling.kingsideSquare);
					if (castling.canCastleQueenside) moves.push(castling.queensideSquare);
				}
			}
		}
	});
	return moves;
};

// long range pieces
const getLongRangeSquares = function (directional_path, file, rank, color) {
	let moves = [];
	directional_path.forEach(([file_map, rank_map]) => {
		let target_file = file + file_map;
		let target_rank = rank + rank_map;
		while (isValidSquare(target_file, target_rank)) {
			if (board[target_rank][target_file] == null)
				moves.push([target_file, target_rank]);
			else {
				if (board[target_rank][target_file].color != color)
					moves.push([target_file, target_rank]);
				break;
			}
			target_file += file_map;
			target_rank += rank_map;
		}
	});
	return moves;
};
const getBishopSquares = function (file, rank, color) {
	let directional_path = [
		[-1, 1],
		[1, 1],
		[1, -1],
		[-1, -1],
	];
	let moves = getLongRangeSquares(directional_path, file, rank, color);
	return moves;
};
const getRookSquares = function (file, rank, color) {
	let directional_path = [
		[-1, 0],
		[0, 1],
		[1, 0],
		[0, -1],
	];
	let moves = getLongRangeSquares(directional_path, file, rank, color);
	return moves;
};
const getQueenSquares = function (file, rank, color) {
	let directional_path = [
		[-1, 1],
		[1, 1],
		[1, -1],
		[-1, -1],
		[-1, 0],
		[0, 1],
		[1, 0],
		[0, -1],
	];
	let moves = getLongRangeSquares(directional_path, file, rank, color);
	return moves;
};
