import { logAppError } from "./logAppError";
import { supabase } from "./supabase";

const DELETE_INSTALLMENT_GROUP_FUNCTION = "delete_installment_group";
const PREPAY_INSTALLMENT_GROUP_FUNCTION = "prepay_installment_group";

type DeletedReceiptFile = {
  storage_bucket: string;
  storage_path: string;
};

type DeleteInstallmentGroupRow = {
  deleted_entry_ids: string[];
  receipt_files: DeletedReceiptFile[];
};

type PrepayInstallmentGroupRow = DeleteInstallmentGroupRow & {
  prepaid_amount: number | string;
  prepaid_entry_id: string;
  prepaid_installment_count: number;
};

export async function deleteInstallmentGroup(
  bookId: string,
  installmentGroupId: string,
): Promise<string[]> {
  const { data, error } = await supabase
    .rpc(DELETE_INSTALLMENT_GROUP_FUNCTION, {
      target_book_id: bookId,
      target_installment_group_id: installmentGroupId,
    })
    .single<DeleteInstallmentGroupRow>();

  if (error || !data) {
    throw error ?? new Error("Failed to delete installment group.");
  }

  void removeCommittedReceiptStorageFiles(data.receipt_files, "delete_installment_group");
  return data.deleted_entry_ids;
}

export async function prepayInstallmentGroup(
  bookId: string,
  installmentGroupId: string,
  prepaymentDate: string,
): Promise<{
  deletedEntryIds: string[];
  installmentCount: number;
  prepaidEntryId: string;
  totalAmount: number;
}> {
  const { data, error } = await supabase
    .rpc(PREPAY_INSTALLMENT_GROUP_FUNCTION, {
      prepayment_date: prepaymentDate,
      target_book_id: bookId,
      target_installment_group_id: installmentGroupId,
    })
    .single<PrepayInstallmentGroupRow>();

  if (error || !data) {
    throw error ?? new Error("Failed to prepay installment group.");
  }

  void removeCommittedReceiptStorageFiles(data.receipt_files, "prepay_installment_group");
  return {
    deletedEntryIds: data.deleted_entry_ids,
    installmentCount: data.prepaid_installment_count,
    prepaidEntryId: data.prepaid_entry_id,
    totalAmount: Number(data.prepaid_amount),
  };
}

async function removeCommittedReceiptStorageFiles(
  receiptFiles: DeletedReceiptFile[],
  step: string,
) {
  const storagePathsByBucket = new Map<string, string[]>();
  for (const receiptFile of receiptFiles) {
    const bucketPaths = storagePathsByBucket.get(receiptFile.storage_bucket) ?? [];
    bucketPaths.push(receiptFile.storage_path);
    storagePathsByBucket.set(receiptFile.storage_bucket, bucketPaths);
  }

  await Promise.all(
    [...storagePathsByBucket].map(async ([storageBucket, storagePaths]) => {
      const { error } = await supabase.storage.from(storageBucket).remove(storagePaths);
      if (error) {
        logAppError("InstallmentTransactions", error, {
          step: `${step}_storage_cleanup`,
          storageBucket,
          storageFileCount: storagePaths.length,
        });
      }
    }),
  );
}
