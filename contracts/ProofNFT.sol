// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {ERC721} from "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import {ERC721URIStorage} from "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import {AccessControl} from "@openzeppelin/contracts/access/AccessControl.sol";

contract ProofNFT is ERC721, ERC721URIStorage, AccessControl {
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");

    uint256 private _nextTokenId = 1; // start at 1
    string private _baseTokenURI;

    event ReceiptMinted(address indexed to, uint256 indexed tokenId);

    constructor(string memory name_, string memory symbol_, string memory baseURI_)
        ERC721(name_, symbol_)
    {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _baseTokenURI = baseURI_;
    }

    function mintReceipt(address to, string calldata tokenURI_)
        external
        onlyRole(MINTER_ROLE)
        returns (uint256 tokenId)
    {
        tokenId = _nextTokenId++;
        _safeMint(to, tokenId);
        if (bytes(tokenURI_).length != 0) {
            _setTokenURI(tokenId, tokenURI_);
        }
        emit ReceiptMinted(to, tokenId);
    }

    function grantMinter(address minter) external onlyRole(DEFAULT_ADMIN_ROLE) {
        _grantRole(MINTER_ROLE, minter);
    }

    function setBaseURI(string calldata newBase) external onlyRole(DEFAULT_ADMIN_ROLE) {
        _baseTokenURI = newBase;
    }

    // ---------- Minimal overrides (OZ v5) ----------

    function _baseURI() internal view override returns (string memory) {
        return _baseTokenURI;
    }

    // Resolve diamond: ERC721 and ERC721URIStorage both define tokenURI
    function tokenURI(uint256 tokenId)
        public
        view
        override(ERC721, ERC721URIStorage)
        returns (string memory)
    {
        return super.tokenURI(tokenId);
    }

    // In OZ v5, ERC721URIStorage also advertises IERC4906 in supportsInterface.
    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(ERC721, ERC721URIStorage, AccessControl)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }
}
