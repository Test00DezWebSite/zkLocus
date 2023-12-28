import { Field, JsonProof } from "o1js";
import { ExactGeoPointCircuit, ExactGeoPointCircuitProof } from "../../zkprogram/public/ExactGeoPointCircuit";
import { ZKLocusProof } from "./ZKLocusProof";
import CachingProofVerificationMiddleware from "./middleware/CachingProofVerificationMiddleware";
import { IO1JSProof } from "./Types";
import type { ZKGeoPoint } from "../models/ZKGeoPoint";
import { GeoPointCommitment } from "../../model/public/Commitment";
import { ZKGeoPointProviderCircuitProof } from "./ZKGeoPointProviderCircuitProof";
import { GeoPointProviderCircuitProof } from "../../zkprogram/private/Geography";
import { GeoPoint } from "../../model/Geography";


/**
 * Represents a proof for an exact geographical point (GeoPoint) in a zero-knowledge circuit.
 * This class is an abstraction over the ExactGeoPointCircuitProof class, which is the actual zero-knowledge proof.
 * The proof is not generated by this class, but rather passed to it in the constructor. In order to generate a proof
 * from an Oracle, use the methods of ZKGeoPoint class.
 */
@CachingProofVerificationMiddleware
export class ZKExactGeoPointCircuitProof extends ZKLocusProof<ExactGeoPointCircuitProof> {
    protected proof: ExactGeoPointCircuitProof;
    protected claimedZKGeoPoint: ZKGeoPoint;

    /**
     * Creates a new instance of ZKExactGeoPointCircuitProof.
     * @param zkGeoPoint The zero-knowledge geometric point.
     * @param proof The proof for the exact geometric point circuit.
     */
    constructor(zkGeoPoint: ZKGeoPoint, proof: ExactGeoPointCircuitProof) {
        super();
        this.proof = proof;
        this.claimedZKGeoPoint = zkGeoPoint;
    }

    /**
     * Creates a ZKExactGeoPointCircuitProof from a ZKGeoPointProviderCircuitProof.
     * 
     * @param proof - The ZKGeoPointProviderCircuitProof to create the ZKExactGeoPointCircuitProof from.
     * @returns A Promise that resolves to a ZKExactGeoPointCircuitProof.
     */
    static async fromZKGeoPointProviderProof(proof: ZKGeoPointProviderCircuitProof): Promise<ZKExactGeoPointCircuitProof> {
        proof.verify();
        const zkGeoPoint: ZKGeoPoint = proof.zkGeoPoint;
        const geoPointProviderProof: GeoPointProviderCircuitProof = proof.zkProof;

        const exactGeoPointProof: ExactGeoPointCircuitProof = await ExactGeoPointCircuit.fromGeoPointProvider(
            geoPointProviderProof,
        );

        return new ZKExactGeoPointCircuitProof(zkGeoPoint, exactGeoPointProof);
    }

    /**
     * Creates an instance of ZKExactGeoPointCircuitProof from a JSON representation.
     * @param jsonProof The JSON representation of the proof.
     * @returns An instance of ZKExactGeoPointCircuitProof.
     */
    static fromJSON(jsonProof: JsonProof): IO1JSProof {
        return ExactGeoPointCircuitProof.fromJSON(jsonProof);
    }

    /**
     * Asserts that the geometric point is the claimed one.
     * Throws an error if the geometric point is not the claimed one.
     */
    protected assertGeoPointIsTheClaimedOne(): void {
        const geoPointCommitment: GeoPointCommitment = this.proof.publicOutput;
        const claimedGeoPointCommitment: Field = this.claimedZKGeoPoint.hash();

        if(!geoPointCommitment.geoPointHash.equals(claimedGeoPointCommitment)) {
            console.log(`The GeoPoint is not the claimed one. The GeoPoint is ${geoPointCommitment.geoPointHash} and the claimed one is ${claimedGeoPointCommitment}`);
            const claimed: ZKGeoPoint = this.claimedZKGeoPoint;
            console.log(`The claimed ZKGeoPoint is ${claimed}`);
            const claimedZK: GeoPoint = claimed.toZKValue();
            console.log(`The claimed GeoPoint is ${claimedZK}`);
            throw new Error("The GeoPoint is not the claimed one");
        }
    }

    /**
     * Verifies the proof.
     * Calls the assertGeoPointIsTheClaimedOne method.
     */
    verify(): void {
        super.verify();
        this.assertGeoPointIsTheClaimedOne();
    }

    /**
     * Gets the zero-knowledge geometric point.
     * Calls the verify method.
     * @returns The zero-knowledge geometric point.
     */
    get zkGeoPoint(): ZKGeoPoint {
        this.verify();
        return this.claimedZKGeoPoint;
    }
}