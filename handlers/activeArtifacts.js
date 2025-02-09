async function handle(request, context) {
	const EID = new URL(request.url).searchParams.get('EID');
    const contract = new URL(request.url).searchParams.get('contract');
	try {

		const bri = new context.proto.BasicRequestInfo()
			.setEiUserId(EID)
			.setClientVersion(99);

		const fcr = new context.proto.EggIncFirstContactRequest()
			.setRinfo(bri)
			.setEiUserId(EID);

		const b64encoded = btoa(context.decoder.decode(fcr.serializeBinary()));

		const params = new URLSearchParams();
		params.append('data', b64encoded);

		const response = await fetch(context.baseURL + "/ei/bot_first_contact", {
			method: "POST",
			body: params
		});

		const text = await response.text();
		const fcresp = context.proto.EggIncFirstContactResponse.deserializeBinary(text);
        const backup = fcresp.toObject().backup;
        
        var farmIndex = 0;
        if (contract !== null) {
            farmIndex = backup.farmsList.findIndex(c => c.contract_id === contract);
        } else {
            farmIndex = backup.farmsList.findIndex(c => c.farmType === 2);
        }

        let mappedArtis = (backup.artifactsDb.activeArtifactSetsList[farmIndex]?.slotsList ?? []).map(slot => {
            return backup.artifactsDb.inventoryItemsList.find(i => i.itemId === slot.itemId);
        })
        return new Response(JSON.stringify(mappedArtis));
	} catch (error) {
		return new Response(JSON.stringify({ error: error.message }), { status: 500 });
	}
}

module.exports = { handle };