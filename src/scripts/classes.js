import { isKingInCheck } from './rules';
import { turn, enPassant, board } from './main';

export class Piece {
	constructor(id, name, color, file, rank) {
		this.id = id;
		this.name = name;
		this.color = color;
		this.initialFileLocation = file;
		this.initialRankLocation = rank;
		this.currentFileLocation = file;
		this.currentRankLocation = rank;
	}
}

export class SelectedSquare {
	constructor() {
		this.base = null;
		this.target = null;
	}
	get isReady() {
		return this.base && this.target ? true : false;
	}
	get isPassantCapture() {
		if (board[this.base[1]][this.base[0]].name != 'Pawn') return false;
		if (enPassant === null) return false;
		let [passantFile, passantRank] = enPassant.passantSquare;
		let [targetFile, targetRank] = this.target;
		if (passantFile == targetFile && passantRank == targetRank) {
			return true;
		} else return false;
	}
	get isPawnPromotion() {
		if (board[this.base[1]][this.base[0]].name != 'Pawn') return false;
		if (this.target[1] == 0 || this.target[1] == 7) return true;
		else return false;
	}
	get isCastling() {
		if (board[this.base[1]][this.base[0]].name != 'King') return false;
		let [baseFile, baseRank] = this.base;
		let [targetFile, targetRank] = this.target;
		if (baseFile == 4 && (targetFile == 6 || targetFile == 2)) {
			if ((baseRank == 0 && targetRank == 0) || baseRank == 7 || targetRank == 7) return true;
			else return false;
		} else return false;
	}
	reset() {
		this.base = null;
		this.target = null;
	}
}
export class Castling {
	constructor(color) {
		this.isKingNotMovedYet = true;
		this.isARookNotMovedYet = true;
		this.isHRookNotMovedYet = true;
		if (color == 'white') {
			this.kingsideSquare = [6, 0];
			this.queensideSquare = [2, 0];
		} else {
			this.kingsideSquare = [6, 7];
			this.queensideSquare = [2, 7];
		}
	}
	get canCastleKingside() {
		if (this.isKingNotMovedYet && this.isHRookNotMovedYet) {
			let rank = this.kingsideSquare[1];
			let squares = [
				[5, rank],
				[6, rank],
			];
			let isValid = squares.every(([file, rank]) => {
				return board[rank][file] === null && !isKingInCheck(file, rank, turn);
			});
			return isValid;
		} else return false;
	}
	get canCastleQueenside() {
		// todo: fix uncastling on b file threat
		if (this.isKingNotMovedYet && this.isARookNotMovedYet) {
			let rank = this.kingsideSquare[1];
			let squares = [
				[1, rank],
				[2, rank],
				[3, rank],
			];
			let isValid = squares.every(([file, rank]) => {
				let result = true;
				switch (file > 1) {
					case true:
						result = !isKingInCheck(file, rank, turn);
					default:
						result = board[rank][file] === null && result;
				}
				return result;
				// return board[rank][file] === null && !isKingInCheck(file, rank, turn);
			});
			return isValid;
		} else return false;
	}
	isCastlingKingside(targetSquare) {
		let [file, rank] = targetSquare;
		if ((rank == 0 || rank == 7) && file == 6) return true;
		else return false;
	}
	isCastlingQueenside(targetSquare) {
		let [file, rank] = targetSquare;
		if ((rank == 0 || rank == 7) && file == 2) return true;
		else return false;
	}
}
